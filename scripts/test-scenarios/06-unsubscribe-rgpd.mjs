#!/usr/bin/env node
/**
 * Scenario 06 : Unsubscribe RGPD (1-click depuis lien mail).
 *
 * Parcours :
 *   1. La cliente recoit un mail welcome (lien "Se desabonner" en footer).
 *   2. Elle clique le lien : POST /api/contacts/unsubscribe { email, token }
 *   3. Le token est verifie via HMAC-SHA256(UNSUBSCRIBE_SECRET, email).
 *   4. Le contact passe en status="unsubscribed" + unsubscribed_at renseigne.
 *   5. Audit_log trace l'action (preuve CNIL).
 *   6. Idempotent : 2e POST avec meme token retourne {success:true, already:true}.
 *   7. Path manuel sans token : retourne erreur (anti revenge-unsubscribe).
 *
 * RGPD article 21 : desabonnement en 1 clic, sans login. Sanction CNIL
 * possible si l'endpoint crashe ou si la demande n'est pas traitee.
 */
import crypto from "node:crypto";
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
  submitForm,
  settle,
  getContact,
  cleanup,
  summary,
  requireDevServer,
} from "./_lib.mjs";

function generateUnsubscribeToken(email) {
  const normalized = email.trim().toLowerCase();
  return crypto.createHmac("sha256", env.UNSUBSCRIBE_SECRET).update(normalized).digest("hex");
}

async function run() {
  title("Scenario 06 : Unsubscribe RGPD (lien 1-click)");
  await requireDevServer();

  step("Verification UNSUBSCRIBE_SECRET present");
  if (!env.UNSUBSCRIBE_SECRET || env.UNSUBSCRIBE_SECRET.length < 16) {
    fail("UNSUBSCRIBE_SECRET absent ou trop court", "Génère via : openssl rand -hex 32");
    return summary();
  }
  pass(`UNSUBSCRIBE_SECRET configuré (${env.UNSUBSCRIBE_SECRET.length} chars)`);

  const email = testEmail("unsub");
  info(`email de test : ${email}`);

  step("Création du contact via formulaire newsletter (état initial)");
  const res = await submitForm("newsletter", { email, first_name: "Camille", consent: true });
  if (!res.ok) {
    fail(`Création contact KO (${res.status})`, JSON.stringify(res.json));
    return summary();
  }
  await settle(300);
  const contact = await getContact(email);
  if (!contact || contact.status !== "active") {
    fail(`contact pas en état active`, JSON.stringify(contact?.status));
    await cleanup(email);
    return summary();
  }
  pass(`contact créé avec status="active"`);

  step("Génération du token HMAC + POST /api/contacts/unsubscribe");
  const token = generateUnsubscribeToken(email);
  const unsubRes = await fetch(`${BASE_URL}/api/contacts/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token }),
  });
  const unsubJson = await unsubRes.json().catch(() => null);
  if (unsubRes.ok && unsubJson?.success) {
    pass(`POST 200 success : ${JSON.stringify(unsubJson)}`);
  } else {
    fail(`POST échoué (${unsubRes.status})`, JSON.stringify(unsubJson));
    await cleanup(email);
    return summary();
  }
  await settle(300);

  step("Vérification : status='unsubscribed' + unsubscribed_at renseigné");
  const c2 = await getContact(email);
  if (c2?.status === "unsubscribed") pass(`status="unsubscribed"`);
  else fail(`status attendu "unsubscribed", actuel "${c2?.status}"`);
  if (c2?.unsubscribed_at) pass(`unsubscribed_at = ${new Date(c2.unsubscribed_at).toLocaleString("fr-FR")}`);
  else fail(`unsubscribed_at manquant`);

  step("Vérification : audit_log trace l'action (preuve CNIL)");
  const { data: audit } = await supabase
    .from("audit_log")
    .select("action, before, after, created_at")
    .eq("entity_id", c2?.id)
    .ilike("action", "%unsubscribe%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (audit) pass(`audit_log : action="${audit.action}"`);
  else fail(`pas d'audit_log unsubscribe`, `Sans trace, défense CNIL difficile`);

  step("Idempotence : 2e POST avec même token");
  const res2 = await fetch(`${BASE_URL}/api/contacts/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token }),
  });
  const json2 = await res2.json().catch(() => null);
  if (res2.ok && json2?.success && json2?.already === true) {
    pass(`2e POST idempotent : {success:true, already:true}`);
  } else {
    fail(`2e POST devrait être idempotent`, JSON.stringify(json2));
  }

  step("Sécurité : POST avec token invalide doit retourner 400");
  const badRes = await fetch(`${BASE_URL}/api/contacts/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token: "deadbeef".repeat(8) }),
  });
  if (badRes.status === 400) pass(`token invalide → 400 (anti-spoofing OK)`);
  else fail(`token invalide → ${badRes.status} (attendu 400)`);

  step("Cleanup");
  await cleanup(email);
  pass(`contact + audit nettoyés (cascade FK)`);

  return summary();
}

const result = await run();
process.exit(result.failed > 0 ? 1 : 0);
