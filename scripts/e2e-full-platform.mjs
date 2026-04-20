#!/usr/bin/env node
/**
 * Test E2E complet de la plateforme : 3 pipelines, lead magnets, séquences, newsletters,
 * forms, imports CSV, quiz responses, billing reminders, audit log.
 *
 * But : catch tous les bugs d'intégrité DB + API + schema drift en 1 run.
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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SITE = "https://emeline-siron.fr";
const TEST_TAG = "__e2e_full";
const bugs = [];
let passed = 0;
let failed = 0;

function log(s, m) { console.log(`\n▸ [${s}] ${m}`); }
function ok(m) { passed++; console.log(`  ✅ ${m}`); }
function bug(c, m, d = "") { failed++; bugs.push({ c, m, d }); console.log(`  🐛 [${c}] ${m}${d ? " — " + d : ""}`); }
function expected(m) { ok(`${m} (comportement attendu)`); }

async function cleanup() {
  const { data: c } = await supabase.from("contacts").select("id").contains("tags", [TEST_TAG]);
  if (c?.length) await supabase.from("contacts").delete().in("id", c.map((r) => r.id));
  await supabase.from("contact_lists").delete().ilike("name", "e2ef_%");
  await supabase.from("contact_list_folders").delete().ilike("name", "e2ef_%");
  await supabase.from("forms").delete().ilike("name", "e2ef_%");
  await supabase.from("email_campaigns").delete().ilike("subject", "e2ef_%");
  await supabase.from("lead_magnets").delete().ilike("slug", "e2ef-%");
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. SCHEMA : toutes les tables Sprint 1-4 présentes avec leurs colonnes
// ═══════════════════════════════════════════════════════════════════════════
async function testSchemaAll() {
  log("SCHEMA", "Vérif intégrité schema (25 migrations)");

  const tables = {
    contacts: ["id", "email", "phone", "tags", "pipeline_stage", "pipeline_family_stage", "pipeline_custom_stage", "is_alumni_evermind", "rgpd_cohort", "last_activity_at"],
    profiles: ["id", "email", "full_name", "role", "coaching_credits_total"],
    enrollments: ["id", "user_id", "product_name", "amount_paid", "status"],
    contact_lists: ["id", "name", "tag_key", "folder_id"],
    contact_list_folders: ["id", "name", "sort_order"],
    contact_notes: ["id", "contact_id", "content", "kind"],
    forms: ["id", "name", "slug", "status", "list_id"],
    email_campaigns: ["id", "subject", "status", "target_tags", "sent_count"],
    email_sequences: ["id", "name", "trigger_type", "trigger_value", "status"],
    email_sequence_steps: ["id", "sequence_id", "step_order", "subject", "html_content"],
    email_sequence_enrollments: ["id", "sequence_id", "contact_id", "status", "current_step", "next_send_at"],
    email_templates: ["id", "key", "subject", "html_content", "available_variables"],
    lead_magnets: ["id", "slug", "name", "format", "welcome_sequence_id", "opt_in_tag"],
    quiz_responses: ["id", "contact_id", "score", "result_category"],
    billing_reminders: ["id", "contact_id", "product", "trial_end", "reminder_j15_sent_at"],
    contact_events: ["id", "contact_id", "event_type", "metadata"],
    consent_log: ["id", "contact_id", "consent_type", "consent_basis"],
    seasonal_enrollments: ["id", "contact_id", "event_slug"],
    audit_log: ["id", "actor_id", "action", "entity_type", "before", "after"],
  };

  for (const [t, cols] of Object.entries(tables)) {
    const { error } = await supabase.from(t).select(cols.join(",")).limit(1);
    if (error) bug("SCHEMA", `${t} : ${error.message}`);
    else ok(`${t} · ${cols.length} colonnes`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. RPC : toutes les fonctions essentielles répondent
// ═══════════════════════════════════════════════════════════════════════════
async function testRPCs() {
  log("RPC", "Vérif fonctions DB");

  const rpcs = [
    { name: "dashboard_stats", args: { month_start: new Date().toISOString(), today_start: new Date().toISOString() } },
    { name: "sequences_with_counts", args: {} },
    { name: "tunnels_stats", args: {} },
    { name: "lead_magnets_performance", args: { period_days: 30 } },
    { name: "alumni_dashboard", args: {} },
    { name: "get_pending_sequence_sends", args: { batch_size: 10 } },
  ];

  for (const r of rpcs) {
    const { error } = await supabase.rpc(r.name, r.args);
    if (error) bug("RPC", `${r.name} : ${error.message}`);
    else ok(`${r.name}()`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. 3 PIPELINES : CRUD sur les 3 colonnes + contraintes
// ═══════════════════════════════════════════════════════════════════════════
async function testThreePipelines() {
  log("PIPELINES", "Test des 3 pipelines (academy / family / custom)");

  const { data: contact, error: cErr } = await supabase
    .from("contacts")
    .insert({
      email: `e2ef-pipelines-${Date.now()}@test.local`,
      first_name: "Triple",
      source: "manuel",
      tags: [TEST_TAG],
    })
    .select()
    .single();

  if (cErr) { bug("PIPELINES", "Création contact", cErr.message); return; }

  // Mettre le contact dans les 3 pipelines simultanément
  const { error: upErr } = await supabase
    .from("contacts")
    .update({
      pipeline_stage: "prospect",
      pipeline_family_stage: "trial_actif",
      pipeline_custom_stage: "qualification",
    })
    .eq("id", contact.id);

  if (upErr) bug("PIPELINES", "Update 3 pipelines simultanés", upErr.message);
  else ok("Contact dans les 3 pipelines simultanément");

  // Vérifier qu'un stage invalide est refusé par CHECK
  const invalids = [
    { col: "pipeline_stage", val: "stage_inexistant", label: "Academy" },
    { col: "pipeline_family_stage", val: "stade_inexistant", label: "Family" },
    { col: "pipeline_custom_stage", val: "pas_valide", label: "Sur-mesure" },
  ];

  for (const { col, val, label } of invalids) {
    const { error } = await supabase.from("contacts").update({ [col]: val }).eq("id", contact.id);
    if (error) expected(`${label} refuse '${val}'`);
    else bug("PIPELINES", `${label} accepte stage invalide '${val}'`);
  }

  // Vérifier RPC dashboard_stats renvoie les 3 counts
  const { data: stats } = await supabase.rpc("dashboard_stats", {
    month_start: new Date().toISOString(),
    today_start: new Date().toISOString(),
  });
  const keys = Object.keys(stats || {});
  if (keys.includes("pipeline_counts") && keys.includes("pipeline_family_counts") && keys.includes("pipeline_custom_counts")) {
    ok("dashboard_stats renvoie les 3 pipelines");
  } else {
    bug("PIPELINES", "dashboard_stats manque des pipeline_counts", keys.join(","));
  }

  await supabase.from("contacts").delete().eq("id", contact.id);
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. SÉQUENCES : toutes les 16 séquences seedées avec leurs mails
// ═══════════════════════════════════════════════════════════════════════════
async function testSequencesContent() {
  log("SEQUENCES", "Intégrité des séquences seedées");

  const expected = [
    "Alumni Evermind (SEQ_AL)",
    "Welcome Masterclass (SEQ_MC)",
    "Migration Brevo cohorte 2 (SEQ_BRV)",
    "Welcome Simulateur (SEQ_SIM)",
    "Welcome Quiz - Profil 0-4 (SEQ_QZ_LOW)",
    "Welcome Quiz - Profil 5-8 (SEQ_QZ_MID)",
    "Welcome Quiz - Profil 9-10 (SEQ_QZ_HIGH)",
    "Nurture maître (SEQ_NM)",
    "Welcome Cahier de vacances (SEQ_CV)",
    "Welcome Chasse aux oeufs (SEQ_CO)",
    "Multi lead-magnet (SEQ_CROSS)",
    "Pré-sale Academy (SEQ_PRESALE)",
    "Post-masterclass visionnée (SEQ_POSTMC)",
    "Réactivation inactifs 90j (SEQ_REACT)",
  ];

  for (const name of expected) {
    const { data: seq } = await supabase
      .from("email_sequences")
      .select("id, status")
      .eq("name", name)
      .maybeSingle();

    if (!seq) {
      bug("SEQUENCES", `Séquence manquante : ${name}`);
      continue;
    }

    const { data: steps } = await supabase
      .from("email_sequence_steps")
      .select("id, subject, html_content")
      .eq("sequence_id", seq.id);

    const withContent = (steps || []).filter(
      (s) => (s.subject || "").trim().length > 0 && (s.html_content || "").trim().length > 100
    );

    if ((steps || []).length === 0) bug("SEQUENCES", `${name} n'a aucun step`);
    else if (withContent.length !== (steps || []).length) {
      bug("SEQUENCES", `${name} : ${steps.length - withContent.length} step(s) sans contenu`);
    } else {
      ok(`${name} : ${steps.length} steps avec contenu`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. TEMPLATES TRANSACTIONNELS
// ═══════════════════════════════════════════════════════════════════════════
async function testTemplates() {
  log("TEMPLATES", "Templates transactionnels DB");

  const expected = [
    "invite_student",
    "reset_password",
    "welcome_purchase_academy",
    "welcome_purchase_family",
    "coaching_booked",
    "chatel_j15",
    "chatel_j7",
    "family_activation_confirmed",
    "family_cancelled",
    "newsletter_bihebdo",
  ];

  for (const key of expected) {
    const { data } = await supabase
      .from("email_templates")
      .select("subject, html_content")
      .eq("key", key)
      .maybeSingle();
    if (!data) bug("TEMPLATES", `Template manquant : ${key}`);
    else if (!data.subject || data.html_content.length < 100) {
      bug("TEMPLATES", `${key} : contenu incomplet`);
    } else {
      ok(`${key} (subject: ${data.subject.slice(0, 40)}…)`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. LEAD MAGNETS : 6 seedés + relations séquences
// ═══════════════════════════════════════════════════════════════════════════
async function testLeadMagnets() {
  log("LEAD_MAGNETS", "Seed des 6 LM + liens séquences welcome");

  const expected = [
    "masterclass-fondatrice",
    "quiz-investissement-locatif",
    "simulateur-rentabilite",
    "cahier-vacances",
    "calendrier-avent",
    "chasse-oeufs",
  ];

  for (const slug of expected) {
    const { data } = await supabase
      .from("lead_magnets")
      .select("id, name, opt_in_tag, welcome_sequence_id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) bug("LEAD_MAGNETS", `LM manquant : ${slug}`);
    else ok(`${slug} (tag: ${data.opt_in_tag}, seq: ${data.welcome_sequence_id ? "lié" : "non lié"})`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. FORMS : 6 forms + endpoint public accessible
// ═══════════════════════════════════════════════════════════════════════════
async function testForms() {
  log("FORMS", "Forms publics");

  const forms = ["masterclass", "quiz-investisseur", "simulateur-rentabilite"];
  for (const slug of forms) {
    const res = await fetch(`${SITE}/api/forms/${slug}`);
    if (res.ok) {
      const data = await res.json();
      if (data.form?.status === "published") ok(`/form/${slug} (published)`);
      else bug("FORMS", `/form/${slug} GET renvoie OK mais status=${data.form?.status}`);
    } else if (res.status === 404) {
      bug("FORMS", `/form/${slug} 404 (devrait être published)`);
    } else {
      bug("FORMS", `/form/${slug} HTTP ${res.status}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. AUTO-ENROLLMENT : quand on ajoute un tag, la séquence matching démarre
// ═══════════════════════════════════════════════════════════════════════════
async function testAutoEnrollment() {
  log("AUTO_ENROLL", "Moteur d'enrollment automatique");

  // Activer temporairement une séquence pour le test
  const { data: seq } = await supabase
    .from("email_sequences")
    .select("id")
    .eq("name", "Welcome Simulateur (SEQ_SIM)")
    .maybeSingle();
  if (!seq) { bug("AUTO_ENROLL", "SEQ_SIM introuvable"); return; }

  await supabase.from("email_sequences").update({ status: "active" }).eq("id", seq.id);

  // Créer un contact et lui ajouter le tag lm:simulateur-rentabilite
  const { data: contact } = await supabase
    .from("contacts")
    .insert({
      email: `e2ef-autoenroll-${Date.now()}@test.local`,
      first_name: "AutoE",
      tags: [TEST_TAG],
      source: "manuel",
    })
    .select()
    .single();

  // Simuler ce que fait l'API : update tags + appel autoEnrollByTags
  // Ici on simule juste l'insert enrollment manuel car autoEnrollByTags est server-side
  await supabase.from("contacts").update({ tags: [TEST_TAG, "lm:simulateur-rentabilite"] }).eq("id", contact.id);
  const { error: enrollErr } = await supabase
    .from("email_sequence_enrollments")
    .insert({
      sequence_id: seq.id,
      contact_id: contact.id,
      status: "active",
      current_step: 0,
      next_send_at: new Date().toISOString(),
    });

  if (enrollErr && enrollErr.code !== "23505") {
    bug("AUTO_ENROLL", `Enrollment échoue : ${enrollErr.message}`);
  } else {
    ok("Enrollment créé avec succès");
  }

  // Vérifier que get_pending_sequence_sends le retourne
  const { data: pending } = await supabase.rpc("get_pending_sequence_sends", { batch_size: 10 });
  const mine = (pending || []).find((p) => p.contact_id === contact.id);
  if (mine) {
    ok(`get_pending_sequence_sends picke l'enrollment (step ${mine.next_step_order})`);
  } else {
    bug("AUTO_ENROLL", "get_pending_sequence_sends ne retourne pas l'enrollment pending");
  }

  // Cleanup + remettre la séquence en draft
  await supabase.from("email_sequences").update({ status: "draft" }).eq("id", seq.id);
  await supabase.from("contacts").delete().eq("id", contact.id);
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. CRON ENDPOINTS : tous répondent 200
// ═══════════════════════════════════════════════════════════════════════════
async function testCronEndpoints() {
  log("CRON", "Endpoints cron");

  const secret = env.CRON_SECRET || "bk3JTO7WwsoTRAnUuVYTUZ5kwCV15IYEqF_BwbrOI2U";
  const endpoints = [
    "/api/cron/process-sequences",
    "/api/cron/detect-behavioral-triggers",
    "/api/cron/chatel-reminders",
  ];

  for (const ep of endpoints) {
    const res = await fetch(`${SITE}${ep}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      ok(`${ep} 200 (${JSON.stringify(data).slice(0, 80)})`);
    } else {
      bug("CRON", `${ep} HTTP ${res.status}`);
    }
  }

  // Test auth : sans bearer doit 401
  const noAuth = await fetch(`${SITE}/api/cron/process-sequences`, { method: "POST" });
  if (noAuth.status === 401) expected("Sans Bearer → 401");
  else bug("CRON", `Sans auth devrait 401, retourne ${noAuth.status}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. WEBHOOK VIDEOASK : répond ready
// ═══════════════════════════════════════════════════════════════════════════
async function testVideoAskWebhook() {
  log("WEBHOOK", "VideoAsk webhook");

  const res = await fetch(`${SITE}/api/webhooks/videoask`);
  if (res.ok) {
    const data = await res.json();
    if (data.status === "webhook ready") ok("GET healthcheck OK");
    else bug("WEBHOOK", "GET status inattendu", JSON.stringify(data));
  } else {
    bug("WEBHOOK", `GET HTTP ${res.status}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. CHECK CONSTRAINTS : email_campaigns status, forms status, etc.
// ═══════════════════════════════════════════════════════════════════════════
async function testChecks() {
  log("CHECKS", "CHECK constraints enum");

  // email_campaigns : status enum
  const { error: e1 } = await supabase.from("email_campaigns").insert({
    subject: "e2ef_check_test",
    html_content: "<p>x</p>",
    status: "statut_bidon",
  });
  if (e1) expected("email_campaigns rejette status invalide");
  else bug("CHECKS", "email_campaigns accepte status invalide");

  // forms : status enum
  const { error: e2 } = await supabase.from("forms").insert({
    name: "e2ef_check",
    slug: "e2ef-check-" + Date.now(),
    title: "test",
    status: "pas_valide",
  });
  if (e2) expected("forms rejette status invalide");
  else bug("CHECKS", "forms accepte status invalide");

  // contact_notes : kind enum
  const { data: c } = await supabase
    .from("contacts")
    .insert({ email: `e2ef-check-${Date.now()}@test.local`, source: "manuel", tags: [TEST_TAG] })
    .select("id")
    .single();
  if (c) {
    const { error: e3 } = await supabase.from("contact_notes").insert({
      contact_id: c.id,
      content: "test",
      kind: "autre",
    });
    if (e3) expected("contact_notes rejette kind invalide");
    else bug("CHECKS", "contact_notes accepte kind invalide");
    await supabase.from("contacts").delete().eq("id", c.id);
  }

  // profiles : coaching_credits_used <= total
  // Check via un profil existant (admin Emeline)
  const { data: profile } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
  if (profile) {
    const { error: e4 } = await supabase
      .from("profiles")
      .update({ coaching_credits_total: 0, coaching_credits_used: 99 })
      .eq("id", profile.id);
    if (e4) expected("profiles rejette used > total");
    else bug("CHECKS", "profiles accepte used > total");
    // Reset
    await supabase.from("profiles").update({ coaching_credits_total: 0, coaching_credits_used: 0 }).eq("id", profile.id);
  }

  // Cleanup
  await supabase.from("email_campaigns").delete().ilike("subject", "e2ef_check%");
}

// ═══════════════════════════════════════════════════════════════════════════
// 12. RATE LIMIT forms/submit
// ═══════════════════════════════════════════════════════════════════════════
async function testRateLimit() {
  log("RATE_LIMIT", "Flood /api/forms/masterclass/submit");

  let blocked = 0;
  for (let i = 0; i < 6; i++) {
    const res = await fetch(`${SITE}/api/forms/masterclass/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `e2ef-rl-${i}-${Date.now()}@test.local`,
        first_name: "RL",
        consent: true,
      }),
    });
    if (res.status === 429) blocked++;
  }
  if (blocked >= 3) ok(`Rate limit actif (${blocked}/6 bloqués)`);
  else bug("RATE_LIMIT", `Rate limit trop permissif (${blocked}/6 bloqués, attendu ≥3)`);
}

// ═══════════════════════════════════════════════════════════════════════════
async function run() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  E2E FULL PLATFORM");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const t0 = Date.now();
  try {
    await cleanup();
    await testSchemaAll();
    await testRPCs();
    await testThreePipelines();
    await testSequencesContent();
    await testTemplates();
    await testLeadMagnets();
    await testForms();
    await testAutoEnrollment();
    await testCronEndpoints();
    await testVideoAskWebhook();
    await testChecks();
    await testRateLimit();
    await cleanup();
  } catch (e) {
    bug("CRASH", "Test crash inattendu", e.message + "\n" + e.stack);
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
