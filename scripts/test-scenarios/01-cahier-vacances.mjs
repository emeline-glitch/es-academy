#!/usr/bin/env node
/**
 * Scenario 01 : Cahier de vacances (exemple Emeline).
 *
 * Parcours :
 *   1. Emeline poste sur Instagram un lien vers /lead-magnets/cahier-vacances.
 *   2. Une visiteuse remplit le formulaire (prenom + email).
 *   3. Le formulaire POST sur /api/forms/cahier-vacances/submit.
 *   4. Le contact est upserte avec les bons tags.
 *   5. Le contact apparait dans la liste "Cahier de vacances" (CRM > Listes).
 *   6. Le contact apparait dans le CRM (table contacts).
 *   7. La sequence "Welcome Cahier de vacances (SEQ_CV)" est enrollee.
 *   8. Le premier mail (lien du cahier) est planifie.
 *
 * Pre-requis : dev server `npm run dev`. La sequence SEQ_CV existe en DB.
 *
 * Note : le formulaire `cahier-vacances` peut etre is_active=false (LM
 * saisonnier juillet-aout). Le scenario active temporairement le form si
 * besoin et le restaure a la fin.
 */
import {
  supabase,
  testEmail,
  title,
  step,
  info,
  pass,
  fail,
  warn,
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

const FORM_SLUG = "cahier-vacances";
const LIST_TAG = "lm:cahier-vacances";
const SEQUENCE_NAME = "Welcome Cahier de vacances (SEQ_CV)";

async function run() {
  title("Scenario 01 : Cahier de vacances (capture Instagram)");
  await requireDevServer();

  // ------------------------------------------------------------------
  step("Verification prealable : formulaire publie ?");
  const { data: form } = await supabase
    .from("forms")
    .select("id, slug, status, tag_on_submit, list_id")
    .eq("slug", FORM_SLUG)
    .maybeSingle();
  if (!form) {
    fail(`formulaire "${FORM_SLUG}" introuvable en DB`);
    return summary();
  }
  pass(`formulaire trouvé (id ${form.id.slice(0, 8)}…)`);
  let restoredStatus = null;
  if (form.status !== "published") {
    warn(`form.status = "${form.status}" — activation temporaire pour le test`);
    restoredStatus = form.status;
    await supabase.from("forms").update({ status: "published" }).eq("id", form.id);
  } else {
    pass(`form.status = "published"`);
  }
  if (form.tag_on_submit === LIST_TAG) pass(`tag_on_submit = "${LIST_TAG}"`);
  else fail(`tag_on_submit attendu "${LIST_TAG}", actuel "${form.tag_on_submit}"`);

  const email = testEmail("cahier");
  info(`email de test : ${email}`);

  // ------------------------------------------------------------------
  step("La visiteuse remplit le formulaire (POST public)");
  const res = await submitForm(FORM_SLUG, {
    email,
    first_name: "Sophie",
    last_name: "Testeuse",
    consent: true,
  });
  if (res.status === 200 || res.status === 201) pass(`POST 200 : ${JSON.stringify(res.json)}`);
  else {
    fail(`POST a échoué (status ${res.status})`, JSON.stringify(res.json));
    await cleanup(email);
    if (restoredStatus) await supabase.from("forms").update({ status: restoredStatus }).eq("id", form.id);
    return summary();
  }
  await settle(400);

  // ------------------------------------------------------------------
  step("Le contact apparait dans le CRM (table contacts)");
  const contact = await getContact(email);
  if (!contact) {
    fail(`contact absent de la table contacts`);
    if (restoredStatus) await supabase.from("forms").update({ status: restoredStatus }).eq("id", form.id);
    return summary();
  }
  pass(`contact trouvé (id ${contact.id.slice(0, 8)}…)`);
  if (contact.first_name === "Sophie") pass(`first_name OK`);
  else fail(`first_name attendu "Sophie", actuel "${contact.first_name}"`);
  expectSource(contact, `form:${FORM_SLUG}`);

  // ------------------------------------------------------------------
  step("Les bons tags sont appliques");
  expectTags(contact, [LIST_TAG, "form_signup", `form:${FORM_SLUG}`]);

  // ------------------------------------------------------------------
  step('Le contact est dans la liste "Cahier de vacances"');
  await expectInList(contact, LIST_TAG, "Cahier de vacances");

  // ------------------------------------------------------------------
  step("La sequence Welcome Cahier de vacances est enrollee");
  await expectSequenceEnrollment(contact, SEQUENCE_NAME);

  // ------------------------------------------------------------------
  step("Cleanup");
  await cleanup(email);
  pass(`contact de test supprimé`);
  if (restoredStatus) {
    await supabase.from("forms").update({ status: restoredStatus }).eq("id", form.id);
    info(`form.status restauré à "${restoredStatus}"`);
  }

  return summary();
}

const result = await run();
process.exit(result.failed > 0 ? 1 : 0);
