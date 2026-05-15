#!/usr/bin/env node
/**
 * Scenario 02 : Newsletter (formulaire generique).
 *
 * Parcours :
 *   1. Visiteur tombe sur la page /newsletter (ou widget integre sur le site).
 *   2. Il saisit prenom + email + coche RGPD.
 *   3. POST /api/forms/newsletter/submit.
 *   4. Contact upserte avec tag "newsletter".
 *   5. Apparait dans la liste "Newsletter" (CRM > Listes).
 *   6. Source = "form:newsletter".
 *   7. Pas de sequence associee (newsletter = envoi manuel par Emeline).
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
  cleanup,
  summary,
  requireDevServer,
} from "./_lib.mjs";

const FORM_SLUG = "newsletter";
const LIST_TAG = "newsletter";

async function run() {
  title("Scenario 02 : Newsletter (signup public)");
  await requireDevServer();

  step("Verification prealable : formulaire publie ?");
  const { data: form } = await supabase
    .from("forms")
    .select("id, slug, status, tag_on_submit, list_id")
    .eq("slug", FORM_SLUG)
    .maybeSingle();
  if (!form) {
    fail(`formulaire "${FORM_SLUG}" introuvable`);
    return summary();
  }
  pass(`formulaire trouvé (id ${form.id.slice(0, 8)}…)`);
  if (form.status === "published") pass(`form.status = "published"`);
  else fail(`form.status = "${form.status}" (attendu "published")`);

  const email = testEmail("newsletter");
  info(`email de test : ${email}`);

  step("Visiteur soumet le formulaire newsletter");
  const res = await submitForm(FORM_SLUG, {
    email,
    first_name: "Marie",
    consent: true,
  });
  if (res.ok) pass(`POST 200 : ${JSON.stringify(res.json)}`);
  else {
    fail(`POST a échoué (${res.status})`, JSON.stringify(res.json));
    await cleanup(email);
    return summary();
  }
  await settle(300);

  step("Le contact arrive dans le CRM");
  const contact = await getContact(email);
  if (!contact) {
    fail(`contact absent`);
    return summary();
  }
  pass(`contact trouvé (id ${contact.id.slice(0, 8)}…)`);
  if (contact.first_name === "Marie") pass(`first_name = "Marie"`);
  else fail(`first_name attendu "Marie", actuel "${contact.first_name}"`);
  expectSource(contact, `form:${FORM_SLUG}`);

  step("Tags appliques");
  expectTags(contact, [LIST_TAG, "form_signup", `form:${FORM_SLUG}`]);

  step('Le contact est dans la liste "Newsletter"');
  await expectInList(contact, LIST_TAG, "Newsletter");

  step("Statut RGPD : active + subscribed_at renseigne");
  if (contact.status === "active") pass(`status = "active"`);
  else fail(`status attendu "active", actuel "${contact.status}"`);
  if (contact.subscribed_at) pass(`subscribed_at = ${new Date(contact.subscribed_at).toLocaleString("fr-FR")}`);
  else fail(`subscribed_at manquant`);

  step("Cleanup");
  await cleanup(email);
  pass(`contact de test supprimé`);

  return summary();
}

const result = await run();
process.exit(result.failed > 0 ? 1 : 0);
