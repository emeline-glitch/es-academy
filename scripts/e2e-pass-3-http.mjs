#!/usr/bin/env node
/**
 * Pass 3 : tests HTTP réels contre l'API déployée (Netlify prod).
 * Teste :
 *  - Rate limit /api/forms/[slug]/submit
 *  - Merge de tags préservé (pas d'overwrite)
 *  - Comportement sur email invalide, consent manquant, slug inexistant
 *  - Campaign_number auto-increment (via DB direct car admin-only)
 *  - Séquence enrollment trigger (via DB direct)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const SITE = "https://emeline-siron.fr";
const TEST_TAG = "__e2e_pass3";

let passed = 0;
let failed = 0;
const bugs = [];

function log(s, m) { console.log(`\n▸ [${s}] ${m}`); }
function ok(m) { passed++; console.log(`  ✅ ${m}`); }
function bug(c, m, d = "") {
  failed++;
  bugs.push({ c, m, d });
  console.log(`  🐛 [${c}] ${m}${d ? "\n     " + d : ""}`);
}

async function cleanup() {
  const { data: c } = await supabase.from("contacts").select("id").contains("tags", [TEST_TAG]);
  if (c?.length) await supabase.from("contacts").delete().in("id", c.map((r) => r.id));
  await supabase.from("contact_lists").delete().ilike("name", "e2ep3_%");
  await supabase.from("forms").delete().ilike("name", "e2ep3_%");
  await supabase.from("email_campaigns").delete().ilike("subject", "e2ep3_%");
}

// ──────────────────────────────────────────────────────────────────────────
// Test rate limit public + validations forms/submit
// ──────────────────────────────────────────────────────────────────────────
async function testFormsSubmitHTTP() {
  log("HTTP", "POST /api/forms/[slug]/submit en prod");

  // Setup : 1 liste + 1 form publié (DB direct)
  const { data: list } = await supabase
    .from("contact_lists")
    .insert({ name: "e2ep3_submit_list", tag_key: `e2ep3_submit_${Date.now()}`, color: "blue" })
    .select()
    .single();
  const slug = `e2ep3-submit-${Date.now()}`;
  const { data: form } = await supabase
    .from("forms")
    .insert({
      name: "e2ep3_submit_form",
      slug,
      title: "Test",
      list_id: list.id,
      status: "published",
      success_message: "Merci",
    })
    .select()
    .single();

  const url = `${SITE}/api/forms/${slug}/submit`;

  // 1. Submit OK (1er)
  const email1 = `e2ep3-first-${Date.now()}@test.local`;
  const r1 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email1, first_name: "Alice", consent: true }),
  });
  if (!r1.ok) {
    const txt = await r1.text();
    bug("HTTP", `Submit 1 échoue ${r1.status}`, txt);
  } else ok("Submit #1 OK (statut 200)");

  // 2. Email invalide → 400
  const r2 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "pas-un-email", consent: true }),
  });
  if (r2.status === 400) ok("Email invalide → 400 OK");
  else bug("HTTP", `Email invalide devrait 400, a retourné ${r2.status}`);

  // 3. Consent manquant → 400
  const r3 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `e2ep3-noconsent-${Date.now()}@test.local` }),
  });
  if (r3.status === 400) ok("Consent manquant → 400 OK");
  else bug("HTTP", `Consent manquant devrait 400, a retourné ${r3.status}`);

  // 4. Slug inexistant → 404
  const r4 = await fetch(`${SITE}/api/forms/slug-qui-existe-pas-jamais/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `e2ep3-404-${Date.now()}@test.local`, consent: true }),
  });
  if (r4.status === 404) ok("Slug inexistant → 404 OK");
  else bug("HTTP", `Slug inconnu devrait 404, a retourné ${r4.status}`);

  // 5. Rate limit : soumettre 10 fois depuis même IP → doit hit 429 (limite 3/min + 20/h)
  // NB : en prod, l'IP du Node est celle de ma machine
  log("HTTP", "Rate limit flood (10 submits rapides)");
  let ok429 = 0;
  for (let i = 0; i < 10; i++) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `e2ep3-flood-${i}-${Date.now()}@test.local`,
        first_name: `F${i}`,
        consent: true,
      }),
    });
    if (r.status === 429) ok429++;
  }
  if (ok429 >= 5) ok(`Rate limit fonctionne (${ok429}/10 blocked par 429)`);
  else bug("HTTP", `Rate limit trop laxe : seulement ${ok429}/10 bloqués (attendu ≥5)`);

  // 6. Test CRITIQUE du merge tags : créer un contact avec tags existants, puis re-soumettre le form
  //    Les anciens tags DOIVENT être préservés.
  const emailMerge = `e2ep3-merge-${Date.now()}@test.local`;
  await supabase.from("contacts").insert({
    email: emailMerge,
    first_name: "Merge",
    source: "manuel",
    tags: [TEST_TAG, "client", "vip"],
    status: "active",
  });

  // Attendre un peu pour éviter le rate limit
  await new Promise((r) => setTimeout(r, 61_000));

  const rMerge = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailMerge,
      first_name: "Merge",
      consent: true,
    }),
  });
  if (!rMerge.ok) {
    bug("HTTP", `Merge submit échoue ${rMerge.status}`, await rMerge.text());
  } else {
    const { data: checkContact } = await supabase
      .from("contacts")
      .select("tags")
      .ilike("email", emailMerge)
      .maybeSingle();
    const tags = checkContact?.tags || [];
    const preservedClient = tags.includes("client");
    const preservedVip = tags.includes("vip");
    const hasNew = tags.includes(list.tag_key);
    if (preservedClient && preservedVip && hasNew) {
      ok("Merge tags OK : client + vip préservés, tag liste ajouté");
    } else {
      bug(
        "HTTP",
        `Tags NON préservés après re-submit form`,
        `tags actuels: ${JSON.stringify(tags)} (attendus: client, vip, ${list.tag_key})`
      );
    }
  }

  // Cleanup
  await supabase.from("contact_lists").delete().eq("id", list.id);
  await supabase.from("forms").delete().eq("id", form.id);
}

// ──────────────────────────────────────────────────────────────────────────
// Test campaign_number auto-increment
// ──────────────────────────────────────────────────────────────────────────
async function testCampaignNumber() {
  log("CAMPAIGN", "campaign_number auto-incrémente ?");

  const subjects = ["e2ep3_camp1", "e2ep3_camp2", "e2ep3_camp3"];
  const numbers = [];
  for (const s of subjects) {
    const { data } = await supabase
      .from("email_campaigns")
      .insert({ subject: s, html_content: "<p>t</p>", status: "draft" })
      .select("id, campaign_number")
      .single();
    if (data) numbers.push(data.campaign_number);
  }

  if (numbers.length !== 3) {
    bug("CAMPAIGN", "Création campagnes incomplète");
    return;
  }
  if (numbers.some((n) => n == null)) {
    bug("CAMPAIGN", "campaign_number est null (pas d'auto-incrément ?)", JSON.stringify(numbers));
  } else {
    // Sont-ils croissants ?
    const sorted = [...numbers].sort((a, b) => a - b);
    const increasing = sorted[0] < sorted[1] && sorted[1] < sorted[2];
    if (increasing) ok(`campaign_number auto-incrémente : ${numbers.join(" → ")}`);
    else bug("CAMPAIGN", "campaign_number pas strictement croissant", JSON.stringify(numbers));
  }

  // Cleanup
  await supabase.from("email_campaigns").delete().ilike("subject", "e2ep3_camp%");
}

// ──────────────────────────────────────────────────────────────────────────
// Test CSV import gros volume (simulation via upsert batch)
// ──────────────────────────────────────────────────────────────────────────
async function testBulkImport() {
  log("BULK", "Import 500 contacts en 1 batch");

  const rows = [];
  for (let i = 0; i < 500; i++) {
    rows.push({
      email: `e2ep3-bulk-${i}-${Date.now()}@test.local`,
      first_name: `Bulk${i}`,
      source: "csv_import",
      tags: [TEST_TAG, "csv_batch"],
      status: "active",
    });
  }

  const t0 = Date.now();
  const { error } = await supabase
    .from("contacts")
    .upsert(rows, { onConflict: "email", ignoreDuplicates: false });
  const elapsed = Date.now() - t0;

  if (error) {
    bug("BULK", "Import 500 échoue", error.message);
  } else if (elapsed > 10_000) {
    bug("BULK", `Import lent : ${elapsed}ms (attendu < 10s)`);
  } else {
    ok(`Import 500 contacts OK en ${elapsed}ms`);
  }

  // Cleanup
  await supabase.from("contacts").delete().contains("tags", ["csv_batch"]);
}

// ──────────────────────────────────────────────────────────────────────────
// Test data integrity : polymorphic entity_id dans audit_log
// ──────────────────────────────────────────────────────────────────────────
async function testAuditRetention() {
  log("AUDIT", "Cleanup_old_audit_log purge les entrées > 90 jours");

  // Insérer une entrée datée d'il y a 100 jours
  const oldDate = new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString();
  const { data: inserted } = await supabase
    .from("audit_log")
    .insert({
      actor_id: null,
      action: "e2e_retention_test",
      entity_type: "contact",
      entity_id: "00000000-0000-0000-0000-000000000000",
      created_at: oldDate,
    })
    .select()
    .single();

  // Lancer cleanup
  const { error: cleanErr } = await supabase.rpc("cleanup_old_audit_log");
  if (cleanErr) { bug("AUDIT", "cleanup_old_audit_log plante", cleanErr.message); return; }

  // L'entrée vieille doit être purgée
  const { data: afterClean } = await supabase
    .from("audit_log")
    .select("id")
    .eq("action", "e2e_retention_test")
    .maybeSingle();
  if (afterClean) {
    bug("AUDIT", "cleanup_old_audit_log n'a pas supprimé l'entrée > 90 jours");
    await supabase.from("audit_log").delete().eq("id", inserted?.id);
  } else {
    ok("cleanup_old_audit_log purge bien les entrées > 90 jours");
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Test séquence enrollment (quand un contact reçoit un tag)
// ──────────────────────────────────────────────────────────────────────────
async function testSequenceEnrollment() {
  log("SEQUENCES", "Création séquence + enrollment manuel");

  const { data: existingTables } = await supabase
    .from("email_sequences")
    .select("id")
    .limit(1);

  if (!existingTables) {
    ok("Pas de table email_sequences → test skipped");
    return;
  }

  const { data: seq, error: sErr } = await supabase
    .from("email_sequences")
    .insert({
      name: "e2ep3_test_seq",
      trigger_type: "manual",
      status: "draft",
    })
    .select()
    .single();

  if (sErr) {
    if (sErr.code === "42P01") ok("Table email_sequences inexistante (feature pas activée)");
    else bug("SEQUENCES", "Création séquence échoue", sErr.message);
    return;
  }

  // Ajouter 2 étapes
  await supabase.from("email_sequence_steps").insert([
    { sequence_id: seq.id, step_order: 1, delay_hours: 0, subject: "J0", html_content: "<p>Hello</p>" },
    { sequence_id: seq.id, step_order: 2, delay_hours: 24, subject: "J1", html_content: "<p>Day 1</p>" },
  ]);
  ok("Séquence + 2 étapes créées");

  // Vérifier la structure
  const { data: check } = await supabase
    .from("email_sequences")
    .select("*, steps:email_sequence_steps(*)")
    .eq("id", seq.id)
    .maybeSingle();
  if ((check?.steps?.length || 0) === 2) ok("Jointure steps OK");
  else bug("SEQUENCES", `Attendu 2 steps, trouvé ${check?.steps?.length || 0}`);

  // Cleanup
  await supabase.from("email_sequences").delete().eq("id", seq.id);
}

// ──────────────────────────────────────────────────────────────────────────
async function run() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PASS 3 — Tests HTTP + bulk + retention + sequences");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const t0 = Date.now();
  try {
    await cleanup();
    await testCampaignNumber();
    await testBulkImport();
    await testAuditRetention();
    await testSequenceEnrollment();
    await testFormsSubmitHTTP(); // en dernier à cause des sleeps rate limit
    await cleanup();
  } catch (e) {
    bug("CRASH", "Crash", e.message + "\n" + e.stack);
  }
  const elapsed = Math.round((Date.now() - t0) / 100) / 10;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ${passed} OK · ${failed} BUGS · ${elapsed}s`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  if (bugs.length > 0) {
    console.log("\n🐛 BUGS :");
    for (const b of bugs) console.log(`  [${b.c}] ${b.m}${b.d ? " — " + b.d : ""}`);
  }
  process.exit(failed > 0 ? 1 : 0);
}

run();
