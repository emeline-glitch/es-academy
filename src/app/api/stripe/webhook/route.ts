import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import { createFamilyGiftPromotionCode } from "@/lib/stripe/family-gift-code";
import { renderEmailTemplate } from "@/lib/email/render-template";
import { sendEmail } from "@/lib/ses/client";
import Stripe from "stripe";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    // Log le message seulement (pas l'objet complet qui peut contenir du payload client)
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[webhook] signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const scope = session.metadata?.scope;

    if (scope === "academy") {
      try {
        await handleAcademyPurchase(session);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        console.error("[webhook] Academy handler failed:", msg);
        return NextResponse.json(
          { error: "Processing failed" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}

async function handleAcademyPurchase(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email || session.customer_email;
  const courseId = session.metadata?.course_id || "methode-emeline-siron";
  const productName = session.metadata?.product_name || "academy-formation";
  const installments = parseInt(session.metadata?.installments || "1", 10);
  const stripeCustomerId = (session.customer as string | null) || null;
  const stripeSubscriptionId = (session.subscription as string | null) || null;

  if (!email) {
    throw new Error(`Missing email in Academy session ${session.id}`);
  }

  // amount_total côté Checkout Session = montant de la 1ère période pour mode
  // subscription, OU total one-shot pour mode payment. Pour le 3x/4x on veut
  // enregistrer le CA TOTAL attendu (3 × 332,67 ou 4 × 249,50), sinon les
  // dashboards sous-comptent les ventes en fractionné.
  const amountFirstInvoice = session.amount_total || 0;
  const amountPaid =
    installments > 1 ? amountFirstInvoice * installments : amountFirstInvoice;

  const supabase = await createServiceClient();
  const emailLower = email.toLowerCase();

  // Idempotence : Stripe retry les webhooks sur 5xx/timeouts. Si on a déjà
  // enrollé cette session (même stripe_session_id), on ne regénère PAS un
  // nouveau code Family (sinon on crée des promotion_codes orphelins dans Stripe).
  const { data: existingEnrollment } = await supabase
    .from("enrollments")
    .select("family_gift_code, family_gift_stripe_promo_id, family_gift_generated_at")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  // 1. Pour 3x/4x : on verrouille la subscription pour qu'elle s'arrête après N paiements
  if (stripeSubscriptionId && installments > 1) {
    await capSubscriptionAtInstallments(stripeSubscriptionId, installments);
  }

  // 2. Créer ou retrouver l'user auth (via profiles.email indexé, pas listUsers
  //    qui plafonne silencieusement à perPage=50 et crée des doublons au-delà).
  const userId = await findOrCreateUserIdByEmail({
    supabase,
    email,
    emailLower,
    fullName: session.customer_details?.name || "",
  });

  // 3. Générer le code cadeau Family (promotion_code Stripe enfant du coupon
  //    parent ACADEMY_3_MOIS_FAMILY), ou réutiliser celui déjà généré sur
  //    une invocation précédente (retry Stripe).
  let gift: { code: string; promoId: string };
  const reusedExisting = Boolean(
    existingEnrollment?.family_gift_code &&
      existingEnrollment.family_gift_stripe_promo_id
  );
  if (reusedExisting) {
    gift = {
      code: existingEnrollment!.family_gift_code!,
      promoId: existingEnrollment!.family_gift_stripe_promo_id!,
    };
  } else {
    gift = await createFamilyGiftPromotionCode({
      stripeCustomerId,
      email,
      sourceSessionId: session.id,
    });
  }

  // 4. Upsert enrollment. On ne ré-écrit family_gift_generated_at que si
  //    on vient de générer le code (sinon on garde l'horodatage d'origine).
  const enrollmentRow: Record<string, unknown> = {
    user_id: userId,
    course_id: courseId,
    product_name: productName,
    stripe_session_id: session.id,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    installments,
    amount_paid: amountPaid,
    family_gift_code: gift.code,
    family_gift_stripe_promo_id: gift.promoId,
  };
  if (!reusedExisting) {
    enrollmentRow.family_gift_generated_at = new Date().toISOString();
  }
  const { error: enrollError } = await supabase
    .from("enrollments")
    .upsert(enrollmentRow, { onConflict: "user_id,course_id" });
  if (enrollError) {
    console.error("[webhook] Enrollment upsert error:", enrollError.message);
  }

  // 5. Upsert contact CRM. On préserve le status existant (RGPD : un contact
  //    "unsubscribed" ne doit JAMAIS être réactivé en "active" automatiquement).
  //    On préserve aussi les tags existants en mergeant avec array_cat.
  const firstName = session.customer_details?.name?.split(" ")[0] || "";
  const lastName =
    session.customer_details?.name?.split(" ").slice(1).join(" ") || "";
  await upsertContactPreservingStatus({
    supabase,
    email,
    firstName,
    lastName,
    addTags: ["client", "academy"],
  });

  // 6. Envoyer le mail de bienvenue avec le code
  await sendAcademyWelcomeEmail({
    to: email,
    firstName,
    giftCode: gift.code,
    installments,
  });
}

async function findOrCreateUserIdByEmail(params: {
  supabase: Awaited<ReturnType<typeof createServiceClient>>;
  email: string;
  emailLower: string;
  fullName: string;
}): Promise<string> {
  const { supabase, email, emailLower, fullName } = params;

  // Lookup via profiles.email avec .eq() (pas .ilike) pour 2 raisons :
  //  1. Supabase auth (GoTrue) normalise les emails en lowercase avant stockage,
  //     donc profiles.email est toujours en lower (via trigger handle_new_user migration 005).
  //     Un match strict suffit, pas besoin de case-insensitive.
  //  2. .ilike() interpréterait les chars % et _ de l'email comme wildcards SQL LIKE,
  //     permettant potentiellement qu'un email foo%bar@x.fr matche foobar@x.fr etc.
  //     Risque d'attribution croisée entre comptes.
  // L'index plain sur profiles.email est ajouté par la migration 026.
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", emailLower)
    .maybeSingle();
  if (existingProfile?.id) return existingProfile.id as string;

  // Sinon on crée. Si race condition (2 webhooks simultanés), createUser renvoie
  // l'erreur "already registered" → on retombe sur le fallback listUsers.
  const { data: newUser, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
  if (newUser?.user) return newUser.user.id;

  const msg = (createError?.message || "").toLowerCase();
  const alreadyExists =
    msg.includes("already") || msg.includes("exists") || msg.includes("registered");

  if (alreadyExists) {
    // Second essai profiles (race condition intra-request : un autre worker a pu créer entre-temps).
    const { data: retryProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", emailLower)
      .maybeSingle();
    if (retryProfile?.id) return retryProfile.id as string;

    // Fallback ultime : user pré-migration 005 ou trigger handle_new_user cassé
    // → profile row manquante. On cherche via auth.admin.listUsers paginé.
    // Limite à 10 pages de 1000 = 10000 users (largement suffisant pour Phase 1).
    for (let page = 1; page <= 10; page++) {
      const { data: list } = await supabase.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      const found = list?.users?.find(
        (u) => u.email?.toLowerCase() === emailLower
      );
      if (found) return found.id;
      if (!list?.users?.length || list.users.length < 1000) break;
    }
  }

  throw new Error(
    `findOrCreateUserIdByEmail a échoué pour ${email}: ${createError?.message || "unknown"}`
  );
}

async function upsertContactPreservingStatus(params: {
  supabase: Awaited<ReturnType<typeof createServiceClient>>;
  email: string;
  firstName: string;
  lastName: string;
  addTags: string[];
}) {
  const { supabase, email, firstName, lastName, addTags } = params;

  // Lecture préalable : on veut préserver status (ex: "unsubscribed") et
  // merger les tags existants (ex: newsletter, lead_magnets).
  const { data: existing } = await supabase
    .from("contacts")
    .select("status, tags")
    .eq("email", email)
    .maybeSingle();

  const mergedTags = Array.from(
    new Set([...(existing?.tags || []), ...addTags])
  );

  const row: Record<string, unknown> = {
    email,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    tags: mergedTags,
    source: "stripe",
  };
  // Ne set status que si le contact n'existait pas OU s'il était "lead"
  // (un "unsubscribed" reste unsubscribed tant qu'il ne se réinscrit pas volontairement).
  if (!existing || existing.status === "lead") {
    row.status = "active";
  }

  const { error } = await supabase
    .from("contacts")
    .upsert(row, { onConflict: "email" });
  if (error) {
    console.error("[webhook] Contact upsert error:", error.message);
  }
}

async function capSubscriptionAtInstallments(
  subscriptionId: string,
  installments: number
) {
  // On utilise SubscriptionSchedule (méthode native Stripe pour "subscription
  // à durée limitée"). Un calcul date-based type `cancel_at = periodEnd + N * periodLen`
  // est piégeux à cause des mois de 28/30/31 jours.
  //
  // IMPORTANT : idempotence. Si webhook retry après un premier appel réussi, la
  // subscription est DÉJÀ bindée à un schedule. `create({from_subscription})`
  // throw "subscription is already attached to a schedule" → 500 → Stripe retry
  // → boucle infinie. Donc on check d'abord si un schedule existe.
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  let scheduleId: string;
  let currentItems: Array<{ price: string | { id: string }; quantity?: number | null }>;

  if (sub.schedule) {
    // Schedule déjà présent (retry du webhook ou précédente exécution).
    const existingScheduleId =
      typeof sub.schedule === "string" ? sub.schedule : sub.schedule.id;
    const existing = await stripe.subscriptionSchedules.retrieve(
      existingScheduleId
    );
    if (existing.metadata?.installments_cap === String(installments)) {
      return; // Déjà cappé à la bonne valeur, rien à faire.
    }
    scheduleId = existing.id;
    currentItems = existing.phases?.[0]?.items ?? [];
  } else {
    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscriptionId,
    });
    scheduleId = schedule.id;
    currentItems = schedule.phases?.[0]?.items ?? [];
  }

  if (!currentItems.length) {
    throw new Error(
      `Schedule ${scheduleId} sans phase items (cap impossible)`
    );
  }

  // Dans l'API dahlia, `duration: { interval, interval_count }` a remplacé
  // l'ancien `iterations: N`. Notre price est mensuel → interval=month, N mois.
  // NOTE Phase 3 : comportement exact "N mois = N factures" à valider sur test
  // clock Stripe avant passage en live (achat début/fin de mois peut différer).
  await stripe.subscriptionSchedules.update(scheduleId, {
    end_behavior: "cancel",
    phases: [
      {
        items: currentItems.map((item) => ({
          price: typeof item.price === "string" ? item.price : item.price.id,
          quantity: item.quantity ?? 1,
        })),
        duration: { interval: "month", interval_count: installments },
        metadata: { installments_cap: String(installments) },
      },
    ],
    metadata: { installments_cap: String(installments) },
  });
}

async function sendAcademyWelcomeEmail(params: {
  to: string;
  firstName: string;
  giftCode: string;
  installments: number;
}) {
  const familyActivationUrl = `${SITE_URL}/family?code=${encodeURIComponent(params.giftCode)}`;
  const paymentLabel =
    params.installments === 1
      ? "998€ en une fois"
      : `${params.installments}x paiement mensuel`;

  const rendered = await renderEmailTemplate("academy_welcome_with_family_gift", {
    prenom: params.firstName,
    email: params.to,
    family_gift_code: params.giftCode,
    family_activation_url: familyActivationUrl,
    payment_label: paymentLabel,
    site_url: SITE_URL,
  });

  if (!rendered) {
    console.error(
      "[webhook] Template 'academy_welcome_with_family_gift' introuvable en DB"
    );
    return;
  }

  const result = await sendEmail({
    to: params.to,
    subject: rendered.subject,
    html: rendered.html,
    from: `${rendered.from_name} <${rendered.from_email}>`,
    replyTo: rendered.reply_to ?? undefined,
  });

  // TODO Phase 3 : si l'envoi SES fail (rate limit, DKIM, sandbox), le client
  // a payé mais ne reçoit pas son code Family. Ajouter :
  //   - colonne enrollments.family_gift_email_sent_at
  //   - cron retry toutes les 10min si sent_at IS NULL AND generated_at < now()-5min
  //   - alerte admin si échec répété (>3 tentatives)
  if (!result.success) {
    console.error("[webhook] Envoi mail bienvenue Academy échoué:", result.error);
  }
}
