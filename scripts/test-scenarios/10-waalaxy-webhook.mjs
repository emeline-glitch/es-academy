#!/usr/bin/env node
/**
 * Scenario 10 : Waalaxy webhook (prospection LinkedIn).
 *
 * Parcours :
 *   1. Une prospectee accepte ton invit LinkedIn via une campagne Waalaxy.
 *   2. Waalaxy trouve son email pro et POST sur /api/webhooks/waalaxy.
 *   3. Le contact arrive dans le CRM avec :
 *      - source = "linkedin-waalaxy"
 *      - tags : source:linkedin-waalaxy, linkedin, waalaxy:<campagne-slug>
 *      - metadata : linkedin_url, company, headline, waalaxy_campaign
 *   4. Il apparait dans la liste "Prospection LinkedIn".
 *   5. Securite : sans le header X-Waalaxy-Secret → 401.
 *   6. Events sans email (prospect_visited) → 200 ignored (pas de retry).
 *
 * Pre-requis : WAALAXY_WEBHOOK_SECRET dans .env.local (genere via openssl).
 */
import {
  supabase,
  env,
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
  expectSource,
  expectInList,
  cleanup,
  summary,
  requireDevServer,
} from "./_lib.mjs";

async function run() {
  title("Scenario 10 : Waalaxy webhook (prospection LinkedIn)");
  await requireDevServer();

  step("Verification WAALAXY_WEBHOOK_SECRET present");
  if (!env.WAALAXY_WEBHOOK_SECRET || env.WAALAXY_WEBHOOK_SECRET.length < 16) {
    fail("WAALAXY_WEBHOOK_SECRET absent", "Génère via : openssl rand -hex 32");
    return summary();
  }
  pass(`secret configuré (${env.WAALAXY_WEBHOOK_SECRET.length} chars)`);

  const email = testEmail("waalaxy");
  info(`email prospectée : ${email}`);

  // ------------------------------------------------------------------
  step("Waalaxy POST l'event prospect_email_found");
  const payload = {
    type: "prospect_email_found",
    data: {
      prospect: {
        email,
        first_name: "Léa",
        last_name: "Investisseuse",
        linkedin_url: "https://linkedin.com/in/lea-investisseuse",
        company: "Patrimoine SARL",
        headline: "Investisseuse immobilière, 5 lots",
      },
      campaign: { id: "camp-123", name: "Investisseurs Bordeaux 2026" },
    },
  };

  const res = await fetch(`${BASE_URL}/api/webhooks/waalaxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Waalaxy-Secret": env.WAALAXY_WEBHOOK_SECRET,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (res.ok && json?.success) {
    pass(`POST 200 : tags_added=${JSON.stringify(json.tags_added)}`);
  } else {
    fail(`POST échoué (${res.status})`, JSON.stringify(json));
    await cleanup(email);
    return summary();
  }
  await settle(300);

  // ------------------------------------------------------------------
  step("Contact créé dans le CRM avec tags + metadata LinkedIn");
  const contact = await getContact(email);
  if (!contact) {
    fail(`contact absent`);
    return summary();
  }
  pass(`contact trouvé (id ${contact.id.slice(0, 8)}…)`);
  if (contact.first_name === "Léa") pass(`first_name = "Léa"`);
  else fail(`first_name attendu "Léa"`);
  expectSource(contact, "linkedin-waalaxy");
  expectTags(contact, [
    "source:linkedin-waalaxy",
    "linkedin",
    "waalaxy:investisseurs-bordeaux-2026",
  ]);

  // Metadata LinkedIn-specifique
  const meta = contact.metadata || {};
  if (meta.linkedin_url) pass(`metadata.linkedin_url présent`);
  else fail(`metadata.linkedin_url manquant`);
  if (meta.linkedin_company) pass(`metadata.linkedin_company = "${meta.linkedin_company}"`);
  else fail(`metadata.linkedin_company manquant`);
  if (meta.waalaxy_campaign) pass(`metadata.waalaxy_campaign = "${meta.waalaxy_campaign}"`);
  else fail(`metadata.waalaxy_campaign manquant`);

  // ------------------------------------------------------------------
  step('Contact dans la liste "Prospection LinkedIn"');
  await expectInList(contact, "source:linkedin-waalaxy", "Prospection LinkedIn");

  // ------------------------------------------------------------------
  step("Sécurité : POST sans secret doit retourner 401");
  const badRes = await fetch(`${BASE_URL}/api/webhooks/waalaxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (badRes.status === 401) pass(`sans header → 401 (sécu OK)`);
  else fail(`sans header → ${badRes.status} (attendu 401)`);

  // ------------------------------------------------------------------
  step("Event sans email (prospect_visited) → 200 ignored");
  const noEmailRes = await fetch(`${BASE_URL}/api/webhooks/waalaxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Waalaxy-Secret": env.WAALAXY_WEBHOOK_SECRET,
    },
    body: JSON.stringify({ type: "prospect_visited", data: { prospect: { first_name: "X" } } }),
  });
  const noEmailJson = await noEmailRes.json();
  if (noEmailRes.ok && noEmailJson?.status === "ignored") {
    pass(`200 + status="ignored" (pas de retry Waalaxy)`);
  } else {
    fail(`event sans email mal géré`, JSON.stringify(noEmailJson));
  }

  // ------------------------------------------------------------------
  step("Idempotence : 2e POST même prospect ne duplique pas");
  const dupRes = await fetch(`${BASE_URL}/api/webhooks/waalaxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Waalaxy-Secret": env.WAALAXY_WEBHOOK_SECRET,
    },
    body: JSON.stringify(payload),
  });
  const dupJson = await dupRes.json();
  if (dupRes.ok) pass(`2e POST OK (tags_added vide) : ${JSON.stringify(dupJson.tags_added)}`);
  else fail(`2e POST échoué`);

  // Verifier qu'on a toujours 1 seul contact en DB pour cet email
  const { count } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("email", email.toLowerCase());
  if (count === 1) pass(`1 seul contact en DB (idempotent OK)`);
  else fail(`${count} contacts pour le même email (doublon)`);

  // ------------------------------------------------------------------
  step("Cleanup");
  await cleanup(email);
  pass(`contact supprimé`);

  return summary();
}

const result = await run();
process.exit(result.failed > 0 ? 1 : 0);
