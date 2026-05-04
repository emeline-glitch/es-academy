import { createFamilyAdminClient } from "@/lib/supabase/family-admin";

/**
 * Helpers de synchronisation Academy → Family appelés depuis le webhook
 * Stripe centralisé (src/app/api/stripe/webhook/route.ts).
 *
 * Architecture (cf docs/architecture/sync-academy-family-supabase.md) :
 *  - 1 seul Stripe (acct_1TPIxG6LFQ0ZMm1e)
 *  - 1 seul webhook centralisé sur emeline-siron.fr
 *  - 2 Supabase séparés (Academy + Family, pas de SSO)
 *  - Le webhook écrit DANS LES 2 Supabase (option A validée)
 *
 * Pivot user Academy ↔ Family :
 *  - Email normalisé (lowercase + trim) comme clé de jointure naturelle
 *  - stripe_customer_id en clé secondaire dès qu'il est connu (1er paiement)
 *  - Les UUIDs auth.users sont DIFFÉRENTS entre les 2 Supabase (bases séparées)
 *
 * Idempotence :
 *  - createUser avec `email_confirm: true` pour skip le mail Supabase auto
 *  - Si user existe déjà côté Family (premier inscrit gratuit, abonné existant),
 *    on récupère son id et on update au lieu de créer.
 */

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Cherche un user Family par email. Si pas trouvé, le crée avec
 * `email_confirm: true` (skip le mail confirmation Supabase auto, on enverra
 * notre propre mail welcome via SES depuis le webhook).
 *
 * Retourne l'user.id côté Family (différent de celui Academy).
 */
async function getOrCreateFamilyUser(
  supaFamily: ReturnType<typeof createFamilyAdminClient>,
  email: string,
  fullName: string,
  metadata: Record<string, unknown>
): Promise<{ userId: string; created: boolean }> {
  const emailLower = normalizeEmail(email);

  // 1. Lookup via auth.admin.listUsers (paginé). On filtre par email côté JS
  //    car listUsers ne supporte pas un filter email natif.
  for (let page = 1; page <= 10; page++) {
    const { data: list } = await supaFamily.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    const found = list?.users?.find(
      (u) => u.email?.toLowerCase() === emailLower
    );
    if (found) {
      return { userId: found.id, created: false };
    }
    if (!list?.users?.length || list.users.length < 1000) break;
  }

  // 2. Pas trouvé : on crée avec email_confirm: true (skip mail Supabase auto).
  const { data, error } = await supaFamily.auth.admin.createUser({
    email: emailLower,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || "",
      ...metadata,
    },
  });

  if (error || !data?.user) {
    // Race condition possible : un autre process a créé entre listUsers et
    // createUser. On retente le lookup une fois.
    const msg = (error?.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      const { data: retry } = await supaFamily.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const found = retry?.users?.find(
        (u) => u.email?.toLowerCase() === emailLower
      );
      if (found) {
        return { userId: found.id, created: false };
      }
    }
    throw new Error(
      `getOrCreateFamilyUser failed for ${email}: ${error?.message || "unknown"}`
    );
  }

  return { userId: data.user.id, created: true };
}

/**
 * Génère un magic link Supabase Family valide ~24h pour l'user.
 * Utilisé dans le mail welcome custom (envoyé via SES) pour qu'il puisse
 * cliquer et atterrir directement loggé sur esfamily.fr/connexion.
 */
export async function generateFamilyMagicLink(
  email: string,
  redirectTo?: string
): Promise<string | null> {
  const supaFamily = createFamilyAdminClient();
  const { data, error } = await supaFamily.auth.admin.generateLink({
    type: "magiclink",
    email: normalizeEmail(email),
    options: {
      redirectTo: redirectTo || "https://esfamily.fr/feed",
    },
  });

  if (error || !data?.properties?.action_link) {
    console.error(
      "[family-sync] generateLink failed:",
      error?.message || "unknown"
    );
    return null;
  }
  return data.properties.action_link;
}

/**
 * Sync l'achat Academy vers Family : pré-crée un user Family (si pas déjà
 * inscrit), met à jour ses champs `profiles.academy_gift_*`. Permet à l'user
 * Academy de venir s'abonner Family plus tard avec son code déjà reconnu.
 *
 * Idempotent : si le user Family existe déjà avec un academy_gift_code, on
 * écrase (utile si Stripe replay).
 */
export async function syncAcademyGiftToFamily(params: {
  email: string;
  fullName: string;
  giftCode: string;
  giftPromoId: string;
}): Promise<{ familyUserId: string; userCreated: boolean }> {
  const supaFamily = createFamilyAdminClient();

  const { userId, created } = await getOrCreateFamilyUser(
    supaFamily,
    params.email,
    params.fullName,
    { source: "academy_purchase" }
  );

  // Update profiles.academy_gift_* (la row profiles est créée auto par le
  // trigger Supabase Family lors du createUser).
  const { error: updateErr } = await supaFamily
    .from("profiles")
    .update({
      academy_gift_code: params.giftCode,
      academy_gift_stripe_promo_id: params.giftPromoId,
      academy_gift_synced_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateErr) {
    console.error(
      "[family-sync] update academy_gift_* failed:",
      updateErr.message
    );
    throw updateErr;
  }

  return { familyUserId: userId, userCreated: created };
}

/**
 * Sync l'abonnement Family vers Family : crée le user Family (si pas déjà)
 * + upsert dans `subscriptions` Family. Idempotent via UNIQUE
 * (stripe_subscription_id) sur la table.
 */
export async function syncFamilySubscription(params: {
  email: string;
  fullName: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: "fondateur" | "standard";
  status: string;
  currentPeriodEnd: string | null;
}): Promise<{ familyUserId: string; userCreated: boolean }> {
  const supaFamily = createFamilyAdminClient();

  const { userId, created } = await getOrCreateFamilyUser(
    supaFamily,
    params.email,
    params.fullName,
    { source: "family_subscription" }
  );

  const { error } = await supaFamily.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      plan: params.plan,
      status: params.status,
      current_period_end: params.currentPeriodEnd,
    },
    { onConflict: "stripe_subscription_id" }
  );

  if (error) {
    console.error("[family-sync] upsert subscription failed:", error.message);
    throw error;
  }

  return { familyUserId: userId, userCreated: created };
}

/**
 * Idempotence webhook : check si l'event Stripe a déjà été traité dans
 * `processed_stripe_events` (Family side). À appeler en début du sync depuis
 * Family. Si déjà traité, on skip pour éviter les doublons (création users,
 * envois mails, etc.).
 *
 * Retourne true si l'event a déjà été processé (skip), false si on doit
 * continuer (et on enregistre l'event comme traité immédiatement après).
 */
export async function isFamilyEventAlreadyProcessed(
  stripeEventId: string
): Promise<boolean> {
  const supaFamily = createFamilyAdminClient();
  const { data } = await supaFamily
    .from("processed_stripe_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle();
  return Boolean(data);
}

export async function markFamilyEventProcessed(
  stripeEventId: string,
  eventType: string,
  scope: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  const supaFamily = createFamilyAdminClient();
  const { error } = await supaFamily
    .from("processed_stripe_events")
    .insert({
      stripe_event_id: stripeEventId,
      event_type: eventType,
      scope,
      meta,
    });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    console.error(
      "[family-sync] mark event processed failed:",
      error.message
    );
  }
}
