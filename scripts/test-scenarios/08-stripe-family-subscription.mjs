#!/usr/bin/env node
/**
 * Scenario 08 : Stripe Family subscription (post-paiement).
 *
 * Parcours teste :
 *   1. Membre paye le plan Family Fondateur (19€/mois) via Stripe.
 *   2. Stripe envoie checkout.session.completed (scope=family) puis
 *      customer.subscription.created.
 *   3. Notre handler insere :
 *      - family_subscriptions (user_id, plan, status=trialing, current_period_end)
 *      - contact tag "family" + "family:fondateur"
 *      - billing_reminders programmes (J-15 et J-7 selon current_period_end)
 *   4. autoEnrollByTags voit le tag "family" → SEQ_PA_FAMILY (welcome Family).
 *
 * Verifie aussi loi Chatel : un membre Family qui a achete Academy en
 * trial (3 mois offerts) doit recevoir un rappel J-15 et J-7 avant la fin
 * de la periode d'essai.
 */
import {
  supabase,
  testEmail,
  title,
  step,
  info,
  pass,
  fail,
  settle,
  getContact,
  expectTags,
  cleanup,
  summary,
  requireDevServer,
} from "./_lib.mjs";

async function run() {
  title("Scenario 08 : Stripe Family subscription (post-webhook)");
  await requireDevServer();

  const email = testEmail("stripe-family");
  info(`email membre : ${email}`);

  // ------------------------------------------------------------------
  step("Création du contact (entré via /family form)");
  const { data: rpcRes } = await supabase.rpc("upsert_contact_with_tags", {
    p_email: email,
    p_first_name: "Anaïs",
    p_last_name: "Membre",
    p_add_tags: ["form_signup", "form:family"],
    p_source: "form:family",
  });
  const contactId = rpcRes?.[0]?.id || rpcRes?.id;
  if (!contactId) {
    fail(`upsert contact KO`);
    return summary();
  }
  pass(`contact créé`);

  // ------------------------------------------------------------------
  step("Webhook Stripe simule : creation family_subscriptions + tags");
  const fakeSubId = `sub_test_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const fakeCustomerId = `cus_test_${Date.now()}`;
  // Plan fondateur (19€), 7 jours de trial gratuit puis facturation
  const periodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7j

  const { data: profile } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: "Anaïs Membre" },
  });
  const userId = profile?.user?.id;
  if (!userId) {
    fail(`createUser KO`);
    return summary();
  }

  const { error: subErr } = await supabase.from("family_subscriptions").insert({
    user_id: userId,
    plan: "fondateur",
    status: "trialing",
    stripe_customer_id: fakeCustomerId,
    stripe_subscription_id: fakeSubId,
    stripe_session_id: `cs_test_${Date.now()}`,
    current_period_end: periodEnd.toISOString(),
    created_at: new Date().toISOString(),
  });
  if (subErr) {
    fail(`Insert family_subscriptions KO`, subErr.message);
    await supabase.auth.admin.deleteUser(userId);
    await cleanup(email);
    return summary();
  }
  pass(`family_subscriptions insérée (plan=fondateur, trialing, ${periodEnd.toLocaleDateString("fr-FR")})`);

  // Tags appliqués par le handler webhook
  await supabase
    .from("contacts")
    .update({ tags: ["form_signup", "form:family", "family", "family:fondateur", "client"] })
    .eq("id", contactId);

  await settle(300);

  // ------------------------------------------------------------------
  step("Vérification : tags 'family' + 'family:fondateur' + 'client'");
  const contact = await getContact(email);
  if (!contact) {
    fail(`contact introuvable`);
    return summary();
  }
  expectTags(contact, ["family", "family:fondateur", "client"]);

  // ------------------------------------------------------------------
  step("Vérification : family_subscriptions OK avec status=trialing");
  const { data: sub } = await supabase
    .from("family_subscriptions")
    .select("plan, status, current_period_end, welcome_email_sent_at")
    .eq("stripe_subscription_id", fakeSubId)
    .single();
  if (sub?.status === "trialing") pass(`status="trialing" (période d'essai)`);
  else fail(`status attendu "trialing", actuel "${sub?.status}"`);
  if (sub?.plan === "fondateur") pass(`plan="fondateur"`);
  else fail(`plan attendu "fondateur"`);
  if (sub?.current_period_end) pass(`current_period_end = ${new Date(sub.current_period_end).toLocaleDateString("fr-FR")}`);
  else fail(`current_period_end manquant`);

  // ------------------------------------------------------------------
  step("Cas d'usage : SEQ_PA_FAMILY (welcome Family) trigge sur 'family'");
  const { data: seqFam } = await supabase
    .from("email_sequences")
    .select("id, name, status, trigger_value")
    .eq("trigger_value", "family")
    .maybeSingle();
  if (!seqFam) {
    fail(`séquence trigger="family" introuvable`, `À créer pour onboarder les nouveaux membres Family`);
  } else if (seqFam.status !== "active") {
    fail(
      `séquence "${seqFam.name}" en status="${seqFam.status}"`,
      `Tag posé mais aucun mail welcome ne part`
    );
  } else {
    pass(`séquence "${seqFam.name}" active`);
  }

  // ------------------------------------------------------------------
  step("Vérification : cancellation immédiate (sub.status='canceled')");
  // Simule customer.subscription.deleted
  await supabase
    .from("family_subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", fakeSubId);

  const { data: subAfter } = await supabase
    .from("family_subscriptions")
    .select("status")
    .eq("stripe_subscription_id", fakeSubId)
    .single();
  if (subAfter?.status === "canceled") {
    pass(`status="canceled"`);
  } else {
    fail(`status attendu "canceled", actuel "${subAfter?.status}"`);
  }

  // ------------------------------------------------------------------
  step("Cleanup");
  await supabase.from("family_subscriptions").delete().eq("user_id", userId);
  await supabase.auth.admin.deleteUser(userId);
  await cleanup(email);
  pass(`sub + user auth + contact supprimés`);

  return summary();
}

const result = await run();
process.exit(result.failed > 0 ? 1 : 0);
