#!/usr/bin/env node
/**
 * Scenario 05 : Post-achat Academy (declenchement SEQ_PA_ACADEMY).
 *
 * Parcours :
 *   1. Une eleve achete Academy via Stripe checkout.
 *   2. Le webhook Stripe upserte le contact avec le tag "academy".
 *   3. autoEnrollByTags voit le tag "academy" et enroll dans
 *      "Post-achat Academy (SEQ_PA_ACADEMY)".
 *   4. Le premier mail (acces plateforme + bienvenue) est planifie.
 *
 * Test pragmatique : on saute la signature Stripe (qui necessite un vrai
 * checkout) et on simule directement la mecanique :
 *   - upsert contact + tag "academy" via la RPC upsert_contact_with_tags
 *   - puis on appelle l'endpoint qui declenche autoEnrollByTags (PATCH contact)
 *
 * C'est ce qui se passe en pratique cote webhook : on ajoute le tag puis
 * on enroll. On valide ici que le branchement tag -> sequence fonctionne.
 */
import {
  supabase,
  BASE_URL,
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

const SEQUENCE_NAME = "Post-achat Academy (SEQ_PA_ACADEMY)";
const POST_PURCHASE_TAG = "academy";

async function run() {
  title("Scenario 05 : Post-achat Academy (tag -> SEQ_PA_ACADEMY)");
  await requireDevServer();

  step("Verification : sequence post-achat existe et est active");
  const { data: seq } = await supabase
    .from("email_sequences")
    .select("id, name, status, trigger_value, steps")
    .eq("name", SEQUENCE_NAME)
    .maybeSingle();
  if (!seq) {
    fail(`séquence "${SEQUENCE_NAME}" introuvable`);
    return summary();
  }
  pass(`séquence trouvée · trigger="${seq.trigger_value}" · status="${seq.status}"`);
  if (seq.trigger_value !== POST_PURCHASE_TAG) {
    fail(
      `trigger_value="${seq.trigger_value}" — attendu "${POST_PURCHASE_TAG}"`,
      `Si le webhook Stripe pose un autre tag, la séquence ne se déclenche pas.`
    );
  }
  if (seq.status !== "active") {
    fail(
      `séquence en status="${seq.status}"`,
      `À activer dans /admin/sequences avant le launch.`
    );
  }

  const email = testEmail("post-achat");
  info(`email cliente : ${email}`);

  // ------------------------------------------------------------------
  step("Simulation : la cliente est cree puis taggee academy");
  // 1. Cree d'abord un contact "vierge" via la RPC (comme un opt-in initial)
  const { data: upsertRes, error: upsertErr } = await supabase.rpc(
    "upsert_contact_with_tags",
    {
      p_email: email,
      p_first_name: "Julie",
      p_last_name: "Cliente",
      p_add_tags: ["form_signup"],
      p_source: "form:masterclass",
    }
  );
  if (upsertErr) {
    fail(`upsert RPC failed`, upsertErr.message);
    return summary();
  }
  const contactId = upsertRes?.[0]?.id || upsertRes?.id;
  if (!contactId) {
    fail(`contact ID manquant dans la réponse RPC`, JSON.stringify(upsertRes));
    return summary();
  }
  pass(`contact créé (id ${contactId.slice(0, 8)}…)`);

  // ------------------------------------------------------------------
  step("La cliente paie : on ajoute le tag academy via PATCH /api/contacts");
  // Cote webhook Stripe, l'upsert ajoute simplement le tag academy et appelle
  // autoEnrollByTags. On simule en passant par l'API admin qui fait pareil.
  // ATTENTION : ce flow ajoute le tag mais ne declenche pas autoEnroll s'il
  // passe par le service client direct. On le force ici via l'API qui appelle
  // autoEnrollByTags si tagsAdded.length > 0.
  const patchRes = await fetch(`${BASE_URL}/api/contacts/${contactId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags: ["form_signup", POST_PURCHASE_TAG] }),
  });
  if (patchRes.status === 401 || patchRes.status === 403) {
    info(`(PATCH ${patchRes.status} : endpoint admin-only, on simule le path webhook)`);
    // Fallback : on applique directement le tag + on appelle l'API qui
    // declenche autoEnroll. Cote prod, c'est le webhook Stripe qui le fait
    // via la RPC + autoEnrollByTags ensemble.
    await supabase
      .from("contacts")
      .update({ tags: ["form_signup", POST_PURCHASE_TAG] })
      .eq("id", contactId);
    // On ne peut pas appeler autoEnrollByTags directement depuis ici (server-side
    // helper). On simule en insant manuellement dans email_sequence_enrollments.
    // Mais c'est ce qu'on veut tester ! Si on simule, on ne teste rien.
    // -> on documente cette limitation et on verifie au moins que le tag est pose.
    info(`autoEnrollByTags non testable depuis le client : limitation E2E`);
  } else if (patchRes.ok) {
    pass(`PATCH 200 : tag academy ajoute via API admin`);
  } else {
    fail(`PATCH erreur (${patchRes.status})`, await patchRes.text());
  }
  await settle(500);

  // ------------------------------------------------------------------
  step("Verification : tag academy bien applique");
  const contact = await getContact(email);
  if (!contact) {
    fail(`contact introuvable apres patch`);
    return summary();
  }
  expectTags(contact, [POST_PURCHASE_TAG, "form_signup"]);

  // ------------------------------------------------------------------
  step("Si la sequence est active, l'enrollment doit exister");
  if (seq.status === "active") {
    await expectSequenceEnrollment(contact, SEQUENCE_NAME);
  } else {
    info(`séquence en draft — enrollment ne sera pas créé tant qu'elle n'est pas activée`);
  }

  // ------------------------------------------------------------------
  step("Cleanup");
  await cleanup(email);
  pass(`contact supprimé`);

  return summary();
}

const result = await run();
process.exit(result.failed > 0 ? 1 : 0);
