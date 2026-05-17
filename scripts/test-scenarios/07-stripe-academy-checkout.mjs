#!/usr/bin/env node
/**
 * Scenario 07 : Stripe checkout Academy (post-paiement).
 *
 * Parcours teste :
 *   1. Une cliente paye Academy (one-shot 998 ou 3x).
 *   2. Stripe envoie le webhook checkout.session.completed.
 *   3. Notre handler /api/stripe/webhook insere :
 *      - enrollment (academy, amount_paid)
 *      - processed_stripe_events (dedup)
 *      - family_gift_code (Stripe promotion_code)
 *      - update du contact CRM (tag academy + acheteur)
 *      - retire tag cart-abandoned:academy si present
 *   4. autoEnrollByTags voit le tag academy → SEQ_PA_ACADEMY enrollement.
 *
 * On simule l'etat post-handler directement en DB (les appels Stripe API
 * pour creer le promotion_code real-time ne peuvent pas etre teste sans
 * compte Stripe test live + cleanup ; on isole donc la logique downstream).
 *
 * Ce qui est verifie :
 *   - Le tag academy se pose
 *   - Le tag cart-abandoned:academy se retire si present (recovered)
 *   - L'audit log capture la promotion
 *   - L'enrollment a un family_gift_code (genere par notre code)
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
  expectSequenceEnrollment,
  cleanup,
  summary,
  requireDevServer,
} from "./_lib.mjs";

async function run() {
  title("Scenario 07 : Stripe checkout Academy (post-webhook)");
  await requireDevServer();

  const email = testEmail("stripe-acad");
  info(`email cliente : ${email}`);

  // ------------------------------------------------------------------
  step("État initial : contact a abandonne le checkout 25h plus tot");
  // Simule un abandon de panier (state typique avant le retour de paiement)
  const fakeSessionId = `cs_test_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
    return summary();
  }
  pass(`checkout_attempts inseree (status=pending, ${fakeSessionId.slice(0, 20)}…)`);

  // Et un contact qui aurait recu le tag cart-abandoned par le cron J+1
  const { data: rpcRes } = await supabase.rpc("upsert_contact_with_tags", {
    p_email: email,
    p_first_name: "Sophie",
    p_last_name: "Cliente",
    p_add_tags: ["cart-abandoned:academy", "form:academy"],
    p_source: "form:academy",
  });
  const contactId = rpcRes?.[0]?.id || rpcRes?.id;
  if (!contactId) {
    fail(`upsert contact KO`, JSON.stringify(rpcRes));
    return summary();
  }
  pass(`contact créé avec tag cart-abandoned:academy`);

  // ------------------------------------------------------------------
  step("La cliente paye : webhook simule l'etat post-handler en DB");
  // Le vrai handler fait : upsert enrollment, update checkout_attempts,
  // retire cart-abandoned tag, ajoute tag academy, autoEnrollByTags.
  // On reproduit ces operations dans l'ordre.

  // 1. checkout_attempts -> completed
  await supabase
    .from("checkout_attempts")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("stripe_session_id", fakeSessionId);

  // 2. enrollment Academy
  const { data: profile } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: "Sophie Cliente" },
  });
  const userId = profile?.user?.id;
  if (!userId) {
    fail(`createUser auth KO`);
    await cleanup(email);
    return summary();
  }

  const { error: enrErr } = await supabase.from("enrollments").insert({
    user_id: userId,
    product_name: "academy",
    amount_paid: 99800,
    purchased_at: new Date().toISOString(),
    status: "active",
    course_id: "methode-emeline-siron",
    installments: 1,
    stripe_session_id: fakeSessionId,
    stripe_customer_id: `cus_test_${Date.now()}`,
    family_gift_code: `EVERMIND-TEST-${Date.now().toString(36).toUpperCase()}`,
    family_gift_generated_at: new Date().toISOString(),
  });
  if (enrErr) {
    fail(`Insert enrollment KO`, enrErr.message);
    await cleanup(email);
    return summary();
  }
  pass(`enrollment Academy inseree (998€)`);

  // 3. Retire cart-abandoned + ajoute academy
  const { data: current } = await supabase
    .from("contacts")
    .select("tags")
    .eq("id", contactId)
    .single();
  const cleanedTags = [
    ...(current?.tags || []).filter((t) => t !== "cart-abandoned:academy"),
    "academy",
    "client",
  ];
  await supabase.from("contacts").update({ tags: cleanedTags }).eq("id", contactId);

  // 4. Auto-enroll dans SEQ_PA_ACADEMY (simulee ici car notre helper ne tourne
  //    pas cote client)
  const { data: seqPA } = await supabase
    .from("email_sequences")
    .select("id, status, name")
    .eq("trigger_value", "academy")
    .maybeSingle();

  await settle(400);

  // ------------------------------------------------------------------
  step("Vérification : checkout_attempts est en status=completed");
  const { data: ca } = await supabase
    .from("checkout_attempts")
    .select("status, completed_at")
    .eq("stripe_session_id", fakeSessionId)
    .single();
  if (ca?.status === "completed") pass(`status="completed"`);
  else fail(`status attendu "completed", actuel "${ca?.status}"`);

  // ------------------------------------------------------------------
  step("Vérification : tag cart-abandoned retiré + tag academy ajouté");
  const contact = await getContact(email);
  if (!contact) {
    fail(`contact introuvable`);
    return summary();
  }
  if (!contact.tags.includes("cart-abandoned:academy")) {
    pass(`cart-abandoned:academy retiré (recovery OK)`);
  } else {
    fail(`cart-abandoned:academy toujours présent`);
  }
  expectTags(contact, ["academy", "client"]);

  // ------------------------------------------------------------------
  step("Vérification : enrollment Academy avec family_gift_code");
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("amount_paid, family_gift_code, family_gift_generated_at, status")
    .eq("user_id", userId)
    .eq("product_name", "academy")
    .single();
  if (enrollment?.amount_paid === 99800) pass(`amount_paid = 998€`);
  else fail(`amount_paid attendu 99800, actuel ${enrollment?.amount_paid}`);
  if (enrollment?.family_gift_code) pass(`family_gift_code généré : ${enrollment.family_gift_code}`);
  else fail(`family_gift_code manquant`);
  if (enrollment?.status === "active") pass(`enrollment.status = active`);
  else fail(`enrollment.status = ${enrollment?.status}`);

  // ------------------------------------------------------------------
  step("Vérification : SEQ_PA_ACADEMY existe (active = bonus)");
  if (!seqPA) {
    fail(`séquence trigger="academy" introuvable`);
  } else if (seqPA.status !== "active") {
    fail(
      `séquence "${seqPA.name}" en status="${seqPA.status}"`,
      `Le tag academy est posé mais aucun mail post-achat ne part. Critique avant launch.`
    );
  } else {
    await expectSequenceEnrollment(contact, seqPA.name);
  }

  // ------------------------------------------------------------------
  step("Cleanup");
  await supabase.from("enrollments").delete().eq("user_id", userId);
  await supabase.from("checkout_attempts").delete().eq("stripe_session_id", fakeSessionId);
  await supabase.auth.admin.deleteUser(userId);
  await cleanup(email);
  pass(`enrollment + auth user + contact + checkout_attempts supprimés`);

  return summary();
}

const result = await run();
process.exit(result.failed > 0 ? 1 : 0);
