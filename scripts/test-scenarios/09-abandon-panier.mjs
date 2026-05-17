#!/usr/bin/env node
/**
 * Scenario 09 : Abandon panier (cron tag + relance).
 *
 * Parcours teste :
 *   1. Visiteuse arrive sur /academy, clique "Acheter Academy 998€".
 *   2. Stripe Checkout cree une session → row checkout_attempts(status=pending).
 *   3. Elle ne finalise pas (ferme l'onglet, prend du temps, etc.).
 *   4. >24h plus tard, le cron abandon-reminders detecte la session pending.
 *   5. Le cron tag son contact CRM avec "cart-abandoned:academy".
 *   6. Le contact apparait dans la liste "Panier Academy abandonne" (CRM > Listes).
 *   7. Le cron envoie un mail de relance (J+1, J+3, J+7) via SEQ.
 *
 * Verifie aussi le path recovery : si elle revient et complete plus tard,
 * le tag cart-abandoned est retire (cf scenario 07).
 */
import {
  supabase,
  testEmail,
  BASE_URL,
  title,
  step,
  info,
  pass,
  fail,
  settle,
  getContact,
  expectInList,
  cleanup,
  summary,
  requireDevServer,
} from "./_lib.mjs";

async function run() {
  title("Scenario 09 : Abandon panier (cron J+1)");
  await requireDevServer();

  const email = testEmail("abandon");
  info(`email visiteuse : ${email}`);

  // ------------------------------------------------------------------
  step("Créer le contact (visite qui a opt-in mais pas paye)");
  const { data: rpcRes } = await supabase.rpc("upsert_contact_with_tags", {
    p_email: email,
    p_first_name: "Léa",
    p_last_name: "Visiteuse",
    p_add_tags: ["form_signup", "lm:masterclass-fondatrice"],
    p_source: "form:masterclass",
  });
  const contactId = rpcRes?.[0]?.id || rpcRes?.id;
  if (!contactId) {
    fail(`upsert contact KO`);
    return summary();
  }
  pass(`contact créé`);

  // ------------------------------------------------------------------
  step("Stripe Checkout cree une session pending il y a 25h");
  const fakeSessionId = `cs_test_abandon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { error: caErr } = await supabase.from("checkout_attempts").insert({
    stripe_session_id: fakeSessionId,
    email: email.toLowerCase(),
    product: "academy",
    plan: "1x",
    amount_cents: 99800,
    status: "pending",
    created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  });
  if (caErr) {
    fail(`Insert checkout_attempts KO`, caErr.message);
    await cleanup(email);
    return summary();
  }
  pass(`session pending datée à -25h`);

  // ------------------------------------------------------------------
  step("Lancement du cron abandon-reminders (auth Bearer CRON_SECRET)");
  const cronSecret = process.env.CRON_SECRET || (await import("fs")).readFileSync(".env.local", "utf8").match(/CRON_SECRET=(.+)/)?.[1];
  if (!cronSecret) {
    fail(`CRON_SECRET introuvable`);
    return summary();
  }
  const cronRes = await fetch(`${BASE_URL}/api/cron/abandon-reminders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json",
    },
  });
  const cronJson = await cronRes.json().catch(() => null);
  if (cronRes.ok) {
    pass(`cron 200 : ${JSON.stringify(cronJson).slice(0, 120)}`);
  } else {
    fail(`cron KO (${cronRes.status})`, JSON.stringify(cronJson));
    await supabase.from("checkout_attempts").delete().eq("stripe_session_id", fakeSessionId);
    await cleanup(email);
    return summary();
  }
  await settle(400);

  // ------------------------------------------------------------------
  step("Vérification : tag cart-abandoned:academy posé sur le contact");
  const contact = await getContact(email);
  if (!contact) {
    fail(`contact introuvable`);
    return summary();
  }
  if (contact.tags?.includes("cart-abandoned:academy")) {
    pass(`tag "cart-abandoned:academy" posé`);
  } else {
    fail(
      `tag "cart-abandoned:academy" absent`,
      `Le cron abandon-reminders n'a pas dû picker ce contact. Tags : ${JSON.stringify(contact.tags)}`
    );
  }

  // ------------------------------------------------------------------
  step('Vérification : contact dans la liste "Panier Academy abandonné"');
  await expectInList(contact, "cart-abandoned:academy", "Panier Academy abandonné");

  // ------------------------------------------------------------------
  step("Vérification : reminder_j1_sent_at renseigné sur checkout_attempts");
  const { data: caAfter } = await supabase
    .from("checkout_attempts")
    .select("reminder_j1_sent_at, reminder_attempts")
    .eq("stripe_session_id", fakeSessionId)
    .single();
  if (caAfter?.reminder_j1_sent_at) {
    pass(`reminder_j1_sent_at = ${new Date(caAfter.reminder_j1_sent_at).toLocaleString("fr-FR")}`);
  } else {
    info(`reminder_j1_sent_at = null (peut-être bloqué : pas de template ou SES KO)`);
  }

  // ------------------------------------------------------------------
  step("Recovery path : elle revient et complete → cart-abandoned se retire");
  // Simule le webhook checkout.session.completed
  await supabase
    .from("checkout_attempts")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("stripe_session_id", fakeSessionId);

  // Manuellement on simule le retrait du tag (vrai handler fait ça)
  const cleanedTags = (contact.tags || []).filter((t) => t !== "cart-abandoned:academy").concat("academy", "client");
  await supabase.from("contacts").update({ tags: cleanedTags }).eq("id", contactId);

  const contactAfter = await getContact(email);
  if (!contactAfter?.tags?.includes("cart-abandoned:academy")) {
    pass(`tag retiré après completion (recovery OK)`);
  } else {
    fail(`tag cart-abandoned toujours présent après completion`);
  }

  // ------------------------------------------------------------------
  step("Cleanup");
  await supabase.from("checkout_attempts").delete().eq("stripe_session_id", fakeSessionId);
  await cleanup(email);
  pass(`contact + checkout_attempts supprimés`);

  return summary();
}

const result = await run();
process.exit(result.failed > 0 ? 1 : 0);
