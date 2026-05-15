#!/usr/bin/env node
/**
 * Scenario 03 : Masterclass fondatrice (LM principal d'acquisition).
 *
 * Parcours :
 *   1. Visiteuse arrive sur /lead-magnets/masterclass-fondatrice (depuis SEO,
 *      pub, Instagram).
 *   2. Remplit le formulaire.
 *   3. POST /api/forms/masterclass/submit.
 *   4. Contact upserte avec tags.
 *   5. Apparait dans la liste "Masterclass fondatrice".
 *   6. Sequence "Welcome Masterclass (SEQ_MC)" enrollee + premier mail planifie.
 *
 * Note : le formulaire applique le tag "lm:masterclass-fondatrice" mais la
 * sequence est triggee par "lm:masterclass" (sans suffixe). Mismatch connu
 * a verifier — sera surface en fail si pas resolu.
 */
import {
  supabase,
  testEmail,
  title,
  step,
  info,
  pass,
  fail,
  submitForm,
  settle,
  getContact,
  expectTags,
  expectSource,
  expectInList,
  expectSequenceEnrollment,
  cleanup,
  summary,
  requireDevServer,
} from "./_lib.mjs";

const FORM_SLUG = "masterclass";
const LIST_TAG = "lm:masterclass-fondatrice";
const SEQUENCE_NAME = "Welcome Masterclass (SEQ_MC)";

async function run() {
  title("Scenario 03 : Masterclass fondatrice");
  await requireDevServer();

  step("Verification prealable : formulaire + sequence");
  const { data: form } = await supabase
    .from("forms")
    .select("id, slug, status, tag_on_submit")
    .eq("slug", FORM_SLUG)
    .maybeSingle();
  if (!form) {
    fail(`formulaire "${FORM_SLUG}" introuvable`);
    return summary();
  }
  pass(`formulaire trouvé · tag_on_submit="${form.tag_on_submit}"`);

  const { data: seq } = await supabase
    .from("email_sequences")
    .select("name, status, trigger_value")
    .eq("name", SEQUENCE_NAME)
    .maybeSingle();
  if (!seq) {
    fail(`séquence "${SEQUENCE_NAME}" introuvable`);
  } else {
    info(`sequence trigger_value="${seq.trigger_value}" · status="${seq.status}"`);
    if (seq.trigger_value === form.tag_on_submit) {
      pass(`✓ trigger sequence === tag form (cohérence OK)`);
    } else {
      fail(
        `mismatch : form pose le tag "${form.tag_on_submit}" mais la séquence attend "${seq.trigger_value}"`,
        `Conséquence : le contact aura le tag mais la sequence ne sera jamais déclenchée.`
      );
    }
  }

  const email = testEmail("masterclass");
  info(`email de test : ${email}`);

  step("La visiteuse remplit le formulaire");
  const res = await submitForm(FORM_SLUG, {
    email,
    first_name: "Camille",
    consent: true,
  });
  if (res.ok) pass(`POST 200`);
  else {
    fail(`POST échoué (${res.status})`, JSON.stringify(res.json));
    await cleanup(email);
    return summary();
  }
  await settle(400);

  step("Le contact arrive dans le CRM");
  const contact = await getContact(email);
  if (!contact) {
    fail(`contact absent`);
    return summary();
  }
  pass(`contact trouvé`);
  expectSource(contact, `form:${FORM_SLUG}`);

  step("Tags appliques");
  expectTags(contact, [LIST_TAG, "form_signup", `form:${FORM_SLUG}`]);

  step('Le contact est dans la liste "Masterclass fondatrice"');
  await expectInList(contact, LIST_TAG, "Masterclass fondatrice");

  step("Sequence Welcome Masterclass enrollee");
  await expectSequenceEnrollment(contact, SEQUENCE_NAME);

  step("Cleanup");
  await cleanup(email);
  pass(`contact supprimé`);

  return summary();
}

const result = await run();
process.exit(result.failed > 0 ? 1 : 0);
