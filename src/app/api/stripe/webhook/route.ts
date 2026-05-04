import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import { createFamilyGiftPromotionCode } from "@/lib/stripe/family-gift-code";
import { sendAcademyWelcomeEmail } from "@/lib/email/welcome-academy";
import { sendFamilyWelcomeEmail } from "@/lib/email/welcome-family";
import { renderEmailTemplate } from "@/lib/email/render-template";
import { sendEmail } from "@/lib/ses/client";
import Stripe from "stripe";

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
    } else if (scope === "family") {
      try {
        await handleFamilyPurchase(session);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        console.error("[webhook] Family handler failed:", msg);
        return NextResponse.json(
          { error: "Processing failed" },
          { status: 500 }
        );
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    try {
      await handleFamilySubscriptionDeleted(sub);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      console.error("[webhook] Family subscription delete failed:", msg);
      // 200 quand même : la résiliation côté Stripe est faite, on ne veut pas
      // que Stripe retry sur un fail interne (idempotence DB déjà gérée).
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    try {
      await handleAcademyPaymentFailed(invoice);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      console.error("[webhook] Academy dunning failed:", msg);
      // On retourne 200 quand même : Stripe retry l'event si on renvoie 5xx,
      // mais notre best-effort de mail dunning ne doit pas bloquer la pipeline
      // (Stripe continue ses smart retries indépendamment).
    }
  }

  return NextResponse.json({ received: true });
}

/**
 * Mail custom de dunning quand une mensualité Academy 3x ou 4x échoue.
 *
 * Stripe gère le smart retry automatique pendant ~7 jours. Notre mail
 * informe le client + lien vers hosted_invoice_url pour mettre à jour
 * sa carte avant que la subscription soit annulée.
 *
 * Détection Academy 3x/4x : on matche STRIPE_PRICE_ACADEMY_3X / _4X
 * dans les invoice line items. Si pas de match (paiement Family ou autre),
 * on ignore l'event proprement.
 *
 * Pas d'idempotence Phase 1 : si Stripe retry l'event sur 5xx, le client
 * reçoit potentiellement 2 mails (rare car retries espacés). À durcir avec
 * une table de dédup invoice_id si volume.
 */
async function handleAcademyPaymentFailed(invoice: Stripe.Invoice) {
  // Stripe API récente : invoice.subscription a été déplacé sous parent.subscription_details.
  const subId = invoice.parent?.subscription_details?.subscription;
  if (!subId) return; // One-shot 1x ou facture manuelle : pas géré ici.

  const academy3x = process.env.STRIPE_PRICE_ACADEMY_3X;
  const academy4x = process.env.STRIPE_PRICE_ACADEMY_4X;
  const academyPriceIds = [academy3x, academy4x].filter(Boolean);
  if (academyPriceIds.length === 0) return;

  let matchedInstallments: number | null = null;
  for (const line of invoice.lines?.data || []) {
    // Stripe API récente : line.price est dans line.pricing.price_details.price.
    const priceRef = line.pricing?.price_details?.price;
    const priceId = typeof priceRef === "string" ? priceRef : priceRef?.id;
    if (priceId === academy3x) matchedInstallments = 3;
    else if (priceId === academy4x) matchedInstallments = 4;
    if (matchedInstallments) break;
  }
  if (!matchedInstallments) return; // Pas une mensualité Academy 3x/4x.

  const email = invoice.customer_email;
  if (!email) {
    console.warn("[dunning] invoice", invoice.id, "sans customer_email");
    return;
  }

  // Idempotence : si on a déjà envoyé le mail dunning pour cette invoice,
  // on skip (Stripe peut retry le webhook sur 5xx → doublon évité).
  const supabaseDedup = await createServiceClient();
  if (invoice.id) {
    const { data: alreadySent } = await supabaseDedup
      .from("processed_dunning_invoices")
      .select("stripe_invoice_id")
      .eq("stripe_invoice_id", invoice.id)
      .maybeSingle();
    if (alreadySent) {
      console.log(`[dunning] invoice ${invoice.id} deja traite, skip`);
      return;
    }
  }

  // Récupère le prénom via profiles si dispo, sinon parse customer_name.
  const supabase = supabaseDedup;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  const fullName = profile?.full_name || invoice.customer_name || "";
  const firstName = fullName.split(" ")[0] || "";

  const amount = ((invoice.amount_due || 0) / 100).toFixed(2);
  const attemptDate = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const invoiceUrl = invoice.hosted_invoice_url || `${process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr"}/dashboard`;

  const rendered = await renderEmailTemplate("academy_dunning_payment_failed", {
    prenom: firstName,
    email,
    amount,
    attempt_date: attemptDate,
    invoice_url: invoiceUrl,
    installments: matchedInstallments,
  });

  if (!rendered) {
    console.error("[dunning] Template 'academy_dunning_payment_failed' introuvable");
    return;
  }

  const result = await sendEmail({
    to: email,
    subject: rendered.subject,
    html: rendered.html,
    from: `${rendered.from_name} <${rendered.from_email}>`,
    replyTo: rendered.reply_to ?? undefined,
  });

  // Audit log pour traçabilité (utile si client se plaint de ne pas avoir reçu le mail).
  await supabase.from("audit_log").insert({
    action: result.success ? "academy_dunning_sent" : "academy_dunning_failed",
    entity_type: "invoice",
    after: {
      stripe_invoice_id: invoice.id,
      email,
      amount_eur: amount,
      installments: matchedInstallments,
      attempt_count: invoice.attempt_count || 1,
      ses_error: result.success ? null : result.error || "unknown",
    },
  });

  // Marqueur idempotence : insert APRES traitement reussi pour eviter doublon
  // sur retry Stripe. On insert meme si SES a fail : le retry a peu de chance
  // de mieux marcher dans la fenetre courte du retry, et si fail systeme on
  // ne veut pas spammer le client.
  if (invoice.id) {
    await supabase.from("processed_dunning_invoices").insert({
      stripe_invoice_id: invoice.id,
      email,
      attempt_count: invoice.attempt_count || 1,
      amount_due_cents: invoice.amount_due || 0,
      ses_success: result.success,
      ses_error: result.success ? null : result.error || "unknown",
    });
  }

  if (!result.success) {
    console.error("[dunning] SES fail:", result.error);
  }
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
  //    Si on crée, on génère un magic link d'activation à passer dans le mail
  //    (sinon le client doit cliquer "mot de passe oublié" sur /connexion).
  const { userId, magicLink } = await findOrCreateUserIdByEmail({
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
  const { data: enrolled, error: enrollError } = await supabase
    .from("enrollments")
    .upsert(enrollmentRow, { onConflict: "user_id,course_id" })
    .select("id, family_gift_email_sent_at")
    .single();
  if (enrollError) {
    console.error("[webhook] Enrollment upsert error:", enrollError.message);
  }
  const enrollmentId = enrolled?.id as string | undefined;
  const alreadySentAt = enrolled?.family_gift_email_sent_at as string | null;

  // 5. Upsert contact CRM via RPC atomique (migration 029).
  //    Le merge des tags + préservation du status (unsubscribed reste unsubscribed)
  //    sont gérés en SQL avec un row lock pris par ON CONFLICT, ce qui élimine
  //    la race condition entre webhooks Stripe concurrents.
  const firstName = session.customer_details?.name?.split(" ")[0] || "";
  const lastName =
    session.customer_details?.name?.split(" ").slice(1).join(" ") || "";
  const { error: contactErr } = await supabase.rpc("upsert_contact_with_tags", {
    p_email: email,
    p_first_name: firstName,
    p_last_name: lastName,
    p_add_tags: ["client", "academy"],
    p_source: "stripe",
  });
  if (contactErr) {
    console.error("[webhook] Contact upsert RPC error:", contactErr.message);
  }

  // 6. Envoyer le mail de bienvenue avec le code.
  //    Idempotence : si Stripe retry le webhook après un envoi déjà réussi, on
  //    ne renvoie pas (sinon le client reçoit le mail Family en double).
  if (alreadySentAt) {
    return;
  }
  await sendAcademyWelcomeEmail({
    supabase,
    enrollmentId,
    to: email,
    firstName,
    giftCode: gift.code,
    installments,
    magicLink,
  });
}

async function findOrCreateUserIdByEmail(params: {
  supabase: Awaited<ReturnType<typeof createServiceClient>>;
  email: string;
  emailLower: string;
  fullName: string;
}): Promise<{ userId: string; magicLink: string | null }> {
  const { supabase, email, emailLower, fullName } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr";

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
  if (existingProfile?.id) {
    // User existant : pas de magic link, le mail renvoie vers /connexion.
    return { userId: existingProfile.id as string, magicLink: null };
  }

  // Création : on utilise generateLink({type: "invite"}) plutôt que createUser(),
  // ce qui crée l'user ET retourne un action_link signé qu'on envoie dans notre
  // propre template SES. Sans ça, le client doit faire "mot de passe oublié"
  // sur /connexion pour activer son compte (UX cassée post-achat).
  // Important : Supabase n'envoie pas d'email automatiquement quand on appelle
  // generateLink (contrairement à inviteUserByEmail).
  const { data: linkData, error: createError } =
    await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: `${siteUrl}/dashboard`,
        data: { full_name: fullName },
      },
    });
  if (linkData?.user) {
    return {
      userId: linkData.user.id,
      magicLink: linkData.properties?.action_link || null,
    };
  }

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
    if (retryProfile?.id) {
      return { userId: retryProfile.id as string, magicLink: null };
    }

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
      if (found) return { userId: found.id, magicLink: null };
      if (!list?.users?.length || list.users.length < 1000) break;
    }
  }

  throw new Error(
    `findOrCreateUserIdByEmail a échoué pour ${email}: ${createError?.message || "unknown"}`
  );
}

/**
 * Handler checkout.session.completed pour scope=family (abonnement ES Family).
 *
 * Crée/met à jour la row family_subscriptions, pose les tags CRM, envoie le
 * mail de bienvenue. Idempotent : si même stripe_session_id arrive à nouveau
 * (retry Stripe), on ne renvoie pas le welcome (skip via welcome_email_sent_at).
 */
async function handleFamilyPurchase(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email || session.customer_email;
  const plan = session.metadata?.plan as "fondateur" | "standard" | undefined;
  const stripeCustomerId = (session.customer as string | null) || null;
  const stripeSubscriptionId = (session.subscription as string | null) || null;

  if (!email) {
    throw new Error(`Missing email in Family session ${session.id}`);
  }
  if (plan !== "fondateur" && plan !== "standard") {
    throw new Error(`Invalid plan '${plan}' in Family session ${session.id}`);
  }
  if (!stripeSubscriptionId) {
    throw new Error(`Missing subscription id in Family session ${session.id}`);
  }

  const supabase = await createServiceClient();
  const emailLower = email.toLowerCase();

  // Récupère current_period_end + status réel depuis Stripe (la session
  // n'expose pas ces champs, ils sont sur la subscription).
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  // Stripe API dahlia : current_period_end n'est plus directement sur la sub
  // mais sur items.data[0].current_period_end (par item de subscription).
  const periodEndUnix =
    sub.items?.data?.[0]?.current_period_end ?? null;
  const currentPeriodEnd = periodEndUnix
    ? new Date(periodEndUnix * 1000).toISOString()
    : null;
  const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
  const status = sub.status; // active, trialing, past_due, etc.

  // Création/lookup user (réutilise le helper Academy, qui gère aussi le magic link).
  const { userId } = await findOrCreateUserIdByEmail({
    supabase,
    email,
    emailLower,
    fullName: session.customer_details?.name || "",
  });

  // Idempotence : check si subscription déjà persistée (retry Stripe).
  const { data: existing } = await supabase
    .from("family_subscriptions")
    .select("id, welcome_email_sent_at")
    .eq("user_id", userId)
    .maybeSingle();

  // Upsert sur user_id (UNIQUE index garantit 1 abo par user, re-souscription
  // après résiliation = update du même row).
  const subscriptionRow: Record<string, unknown> = {
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_session_id: session.id,
    plan,
    status,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
  };

  const { data: upserted, error: upsertError } = await supabase
    .from("family_subscriptions")
    .upsert(subscriptionRow, { onConflict: "user_id" })
    .select("id")
    .single();

  if (upsertError) {
    console.error("[webhook] family_subscriptions upsert error:", upsertError.message);
    throw upsertError;
  }
  const subscriptionId = upserted?.id as string | undefined;

  // Tags CRM : merge atomique via RPC (préserve unsubscribed status etc).
  const firstName = session.customer_details?.name?.split(" ")[0] || "";
  const lastName =
    session.customer_details?.name?.split(" ").slice(1).join(" ") || "";
  const { error: contactErr } = await supabase.rpc("upsert_contact_with_tags", {
    p_email: email,
    p_first_name: firstName,
    p_last_name: lastName,
    p_add_tags: ["client", "family", `family:${plan}`],
    p_source: "stripe",
  });
  if (contactErr) {
    console.error("[webhook] Family contact upsert RPC error:", contactErr.message);
  }

  // Mail welcome : idempotent (skip si déjà envoyé sur ce subscription).
  if (existing?.welcome_email_sent_at) {
    return;
  }
  await sendFamilyWelcomeEmail({
    supabase,
    subscriptionId,
    to: email,
    firstName,
    plan,
  });
}

/**
 * Handler customer.subscription.deleted : marque la row family_subscriptions
 * comme canceled. On garde la row (historique + tag CRM "family" préservé pour
 * remarketing potentiel) et on garde aussi le tag (un user qui a été abonné
 * Family est une info utile pour la segmentation, à différencier d'un cold
 * lead). À reconsidérer plus tard si volume.
 */
async function handleFamilySubscriptionDeleted(sub: Stripe.Subscription) {
  const supabase = await createServiceClient();

  const { data: row, error } = await supabase
    .from("family_subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
    })
    .eq("stripe_subscription_id", sub.id)
    .select("id, user_id")
    .maybeSingle();

  if (error) {
    console.error("[webhook] family_subscriptions cancel update error:", error.message);
    return;
  }
  if (!row) {
    // Sub inconnue : event reçu pour un abo qui n'a jamais été persisté
    // (ex : webhook activé après création de la sub côté Stripe). On ignore.
    console.warn(`[webhook] subscription.deleted for unknown sub ${sub.id}`);
    return;
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

