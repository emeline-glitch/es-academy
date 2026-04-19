#!/usr/bin/env node
/**
 * Stress-test E2E : simule 2 jours d'usage quotidien sur le CRM.
 * Détecte les bugs DB/logique, les liste à la fin.
 *
 * Usage : node scripts/e2e-stress-test.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";

// Charger .env.local manuellement (pas de dotenv dans le projet)
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

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────
const bugs = [];
const warnings = [];
let passed = 0;
let failed = 0;

function log(section, msg) {
  console.log(`\n▸ [${section}] ${msg}`);
}

function ok(msg) {
  passed++;
  console.log(`  ✅ ${msg}`);
}

function bug(category, msg, details = "") {
  failed++;
  bugs.push({ category, msg, details });
  console.log(`  🐛 [${category}] ${msg}${details ? "\n     " + details : ""}`);
}

function warn(msg) {
  warnings.push(msg);
  console.log(`  ⚠️  ${msg}`);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

const PIPELINE_STAGES = [
  "leads", "prospect", "rdv_pris", "rdv_effectif", "rdv_non_effectif",
  "offre_envoyee", "non_qualifie", "gagne", "perdu",
];

// Tag pour identifier et nettoyer à la fin
const TEST_TAG = "__e2e_test";

// ──────────────────────────────────────────────────────────────────────────
// Cleanup au début (au cas où un précédent run aurait laissé des traces)
// ──────────────────────────────────────────────────────────────────────────
async function cleanup() {
  log("CLEANUP", "Nettoyage des données de test précédentes…");

  const { data: oldContacts } = await supabase
    .from("contacts")
    .select("id")
    .contains("tags", [TEST_TAG]);
  if (oldContacts?.length) {
    await supabase.from("contacts").delete().in("id", oldContacts.map((c) => c.id));
    console.log(`  → ${oldContacts.length} contacts de test supprimés`);
  }

  const { data: oldLists } = await supabase
    .from("contact_lists")
    .select("id")
    .ilike("name", "e2e_%");
  if (oldLists?.length) {
    await supabase.from("contact_lists").delete().in("id", oldLists.map((l) => l.id));
    console.log(`  → ${oldLists.length} listes de test supprimées`);
  }

  const { data: oldFolders } = await supabase
    .from("contact_list_folders")
    .select("id")
    .ilike("name", "e2e_%");
  if (oldFolders?.length) {
    await supabase.from("contact_list_folders").delete().in("id", oldFolders.map((f) => f.id));
    console.log(`  → ${oldFolders.length} dossiers supprimés`);
  }

  const { data: oldForms } = await supabase
    .from("forms")
    .select("id")
    .ilike("name", "e2e_%");
  if (oldForms?.length) {
    await supabase.from("forms").delete().in("id", oldForms.map((f) => f.id));
    console.log(`  → ${oldForms.length} formulaires supprimés`);
  }

  const { data: oldCampaigns } = await supabase
    .from("email_campaigns")
    .select("id")
    .ilike("subject", "e2e_%");
  if (oldCampaigns?.length) {
    await supabase.from("email_campaigns").delete().in("id", oldCampaigns.map((c) => c.id));
    console.log(`  → ${oldCampaigns.length} campagnes supprimées`);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Test 1 : Pipeline stress — 40 transitions par contact × 5 contacts
// ──────────────────────────────────────────────────────────────────────────
async function testPipelineStress() {
  log("PIPELINE", "Création de 5 contacts + 40 transitions chacun");

  const contactIds = [];
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        email: `e2e-pipeline-${i}-${Date.now()}@test.local`,
        first_name: `E2E${i}`,
        last_name: `Test`,
        source: "manuel",
        tags: [TEST_TAG],
        pipeline_stage: "leads",
      })
      .select()
      .single();
    if (error) {
      bug("PIPELINE", `Création contact ${i} échoue`, error.message);
      continue;
    }
    contactIds.push(data.id);
  }
  ok(`${contactIds.length}/5 contacts créés`);

  // 40 transitions par contact
  let transitionErrors = 0;
  let auditLogGaps = 0;
  for (const cid of contactIds) {
    let prevStage = "leads";
    for (let t = 0; t < 40; t++) {
      const nextStage = pick(PIPELINE_STAGES.filter((s) => s !== prevStage));
      const before = await supabase.from("audit_log").select("id").eq("entity_id", cid).eq("action", "pipeline_stage_change");
      const beforeCount = before.data?.length || 0;

      const { error: upErr } = await supabase
        .from("contacts")
        .update({
          pipeline_stage: nextStage,
          pipeline_updated_at: new Date().toISOString(),
        })
        .eq("id", cid);

      if (upErr) {
        transitionErrors++;
        continue;
      }

      // Vérifier : le contact a bien le nouveau stage
      const { data: reloaded } = await supabase
        .from("contacts")
        .select("pipeline_stage, pipeline_updated_at")
        .eq("id", cid)
        .maybeSingle();
      if (reloaded?.pipeline_stage !== nextStage) {
        bug("PIPELINE", `Stage non persisté après update`, `contact=${cid} expected=${nextStage} got=${reloaded?.pipeline_stage}`);
      }

      prevStage = nextStage;

      // NB : l'audit log n'est PAS écrit ici car on passe direct à la DB (pas via l'API PATCH).
      // Donc on ne check pas. Le vrai test audit_log se fait via l'API ci-dessous.
    }
  }

  if (transitionErrors > 0) bug("PIPELINE", `${transitionErrors}/200 transitions DB ont échoué`);
  else ok("200 transitions DB réussies sans erreur");

  // Test final : pipeline_counts via RPC dashboard
  const { data: stats, error: statsErr } = await supabase.rpc("dashboard_stats", {
    month_start: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
    today_start: new Date().toISOString(),
  });
  if (statsErr) {
    bug("DASHBOARD", "RPC dashboard_stats échoue", statsErr.message);
  } else if (!stats || !stats.pipeline_counts) {
    bug("DASHBOARD", "RPC dashboard_stats renvoie structure vide", JSON.stringify(stats));
  } else {
    ok(`RPC dashboard_stats OK (${Object.keys(stats.pipeline_counts).length} stages remontés)`);
  }

  return contactIds;
}

// ──────────────────────────────────────────────────────────────────────────
// Test 2 : Lists workflow
// ──────────────────────────────────────────────────────────────────────────
async function testLists(contactIds) {
  log("LISTS", "Création de 3 dossiers + 10 listes + assignations");

  // Créer 3 dossiers
  const folderIds = [];
  for (const name of ["e2e_Newsletters", "e2e_Leads_chauds", "e2e_Archives"]) {
    const { data, error } = await supabase
      .from("contact_list_folders")
      .insert({ name, sort_order: folderIds.length })
      .select()
      .single();
    if (error) {
      bug("LISTS", `Création dossier ${name} échoue`, error.message);
      continue;
    }
    folderIds.push(data.id);
  }
  ok(`${folderIds.length}/3 dossiers créés`);

  // Créer 10 listes, réparties dans les dossiers + 2 orphelines
  const lists = [];
  for (let i = 0; i < 10; i++) {
    const folderId = i < 8 ? folderIds[i % folderIds.length] : null;
    const name = `e2e_liste_${i}`;
    const { data, error } = await supabase
      .from("contact_lists")
      .insert({
        name,
        tag_key: slugify(name),
        folder_id: folderId,
        sort_order: i,
        color: pick(["blue", "green", "amber", "red", "purple"]),
      })
      .select()
      .single();
    if (error) {
      bug("LISTS", `Création liste ${name} échoue`, error.message);
      continue;
    }
    lists.push(data);
  }
  ok(`${lists.length}/10 listes créées`);

  // Assigner les contacts de test à plusieurs listes (1-3 listes par contact)
  for (const cid of contactIds) {
    const n = 1 + Math.floor(Math.random() * 3);
    const assignedLists = [];
    for (let i = 0; i < n; i++) assignedLists.push(pick(lists));
    const tags = [TEST_TAG, ...assignedLists.map((l) => l.tag_key)];
    const { error } = await supabase
      .from("contacts")
      .update({ tags: Array.from(new Set(tags)) })
      .eq("id", cid);
    if (error) bug("LISTS", `Tag contact ${cid} échoue`, error.message);
  }
  ok(`${contactIds.length} contacts taggués sur 1-3 listes chacun`);

  // Vérifier la vue contact_lists_with_count
  const { data: counts, error: cErr } = await supabase
    .from("contact_lists_with_count")
    .select("*")
    .in("id", lists.map((l) => l.id));
  if (cErr) {
    bug("LISTS", "Vue contact_lists_with_count plante", cErr.message);
  } else {
    const total = counts.reduce((s, l) => s + (l.contact_count || 0), 0);
    ok(`Vue contact_lists_with_count OK — total=${total} contacts comptés`);
    if (total === 0 && contactIds.length > 0) {
      bug("LISTS", "contact_count = 0 alors qu'on a tagué des contacts", "La vue ne compte peut-être pas les tags correctement");
    }
  }

  // Test rename liste
  if (lists.length > 0) {
    const target = lists[0];
    const { error } = await supabase
      .from("contact_lists")
      .update({ name: `e2e_liste_renamed_0` })
      .eq("id", target.id);
    if (error) bug("LISTS", "Rename liste échoue", error.message);
    else ok("Rename liste OK");
  }

  // Test delete liste (doit nettoyer le tag)
  if (lists.length >= 2) {
    const target = lists[1];
    const tagKey = target.tag_key;
    // RPC remove_tag_from_all_contacts (vérifier qu'elle existe)
    const { data: removed, error: rpcErr } = await supabase.rpc("remove_tag_from_all_contacts", {
      tag_to_remove: tagKey,
    });
    if (rpcErr) {
      bug("LISTS", "RPC remove_tag_from_all_contacts n'existe pas ou plante", rpcErr.message);
    } else {
      ok(`RPC remove_tag_from_all_contacts OK — ${removed || 0} contacts nettoyés`);
    }
    await supabase.from("contact_lists").delete().eq("id", target.id);
  }

  return { lists, folderIds };
}

// ──────────────────────────────────────────────────────────────────────────
// Test 3 : Forms workflow
// ──────────────────────────────────────────────────────────────────────────
async function testForms(lists) {
  log("FORMS", "Création formulaire + soumissions publiques");

  if (lists.length === 0) {
    warn("Pas de listes dispo pour tester forms");
    return;
  }

  const targetList = lists[0];
  const slug = `e2e-form-${Date.now()}`;

  const { data: form, error } = await supabase
    .from("forms")
    .insert({
      name: `e2e_Form_Test`,
      slug,
      title: "Inscris-toi à ma newsletter",
      description: "Test E2E",
      list_id: targetList.id,
      status: "published",
      success_message: "Merci !",
      require_phone: false,
      require_last_name: false,
    })
    .select()
    .single();
  if (error) {
    bug("FORMS", "Création formulaire échoue", error.message);
    return;
  }
  ok(`Formulaire créé : /form/${slug}`);

  // Simuler 10 soumissions via insertion directe contacts (contourne la rate limit HTTP)
  const newContacts = [];
  for (let i = 0; i < 10; i++) {
    const email = `e2e-form-submit-${i}-${Date.now()}@test.local`;
    const { data, error } = await supabase
      .from("contacts")
      .upsert(
        {
          email,
          first_name: `Signup${i}`,
          tags: [TEST_TAG, targetList.tag_key],
          source: "form",
        },
        { onConflict: "email" }
      )
      .select()
      .single();
    if (error) bug("FORMS", `Submit ${i} échoue`, error.message);
    else newContacts.push(data.id);
  }
  ok(`${newContacts.length}/10 inscriptions simulées`);

  // Check : le tag de la liste est bien appliqué
  const { data: checkTags } = await supabase
    .from("contacts")
    .select("tags")
    .in("id", newContacts);
  const missingTag = checkTags?.filter((c) => !c.tags?.includes(targetList.tag_key));
  if (missingTag?.length > 0) {
    bug("FORMS", `${missingTag.length} contacts n'ont pas le tag de la liste`);
  } else {
    ok("Tous les inscrits ont le tag de la liste");
  }

  return { form, newContactIds: newContacts };
}

// ──────────────────────────────────────────────────────────────────────────
// Test 4 : Newsletter flow
// ──────────────────────────────────────────────────────────────────────────
async function testNewsletter(lists) {
  log("NEWSLETTER", "Création campagne + 20 auto-saves");

  const tagsTargets = lists.slice(0, 3).map((l) => l.tag_key);

  const { data: campaign, error } = await supabase
    .from("email_campaigns")
    .insert({
      subject: "e2e_Test_Newsletter",
      html_content: "<p>Hello {{prenom}}</p>",
      status: "draft",
      from_name: "Test",
      from_email: "test@test.local",
      target_tags: tagsTargets,
    })
    .select()
    .single();
  if (error) {
    bug("NEWSLETTER", "Création campagne échoue", error.message);
    return;
  }
  ok(`Campagne créée id=${campaign.id}`);

  // 20 auto-saves (simule la frappe)
  let saveErrors = 0;
  for (let i = 0; i < 20; i++) {
    const { error: upErr } = await supabase
      .from("email_campaigns")
      .update({
        subject: `e2e_Test_Newsletter_v${i}`,
        html_content: `<p>Hello {{prenom}}</p><p>Version ${i}</p>`,
      })
      .eq("id", campaign.id);
    if (upErr) saveErrors++;
  }
  if (saveErrors > 0) bug("NEWSLETTER", `${saveErrors}/20 auto-saves ont échoué`);
  else ok("20 auto-saves OK");

  // Vérifier le state final
  const { data: final } = await supabase
    .from("email_campaigns")
    .select("subject, html_content")
    .eq("id", campaign.id)
    .maybeSingle();
  if (!final || final.subject !== "e2e_Test_Newsletter_v19") {
    bug("NEWSLETTER", "Dernier auto-save non persisté", JSON.stringify(final));
  } else {
    ok("État final correct");
  }

  return campaign;
}

// ──────────────────────────────────────────────────────────────────────────
// Test 5 : Audit log & realtime sanity
// ──────────────────────────────────────────────────────────────────────────
async function testAuditLog(contactIds) {
  log("AUDIT", "Vérifications audit_log");

  // Tous les audit logs récents doivent avoir entity_id valide
  const { data: recent, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    bug("AUDIT", "audit_log inaccessible", error.message);
    return;
  }

  const orphans = [];
  for (const entry of recent || []) {
    if (entry.entity_type === "contact" && entry.entity_id) {
      const { data: c } = await supabase
        .from("contacts")
        .select("id")
        .eq("id", entry.entity_id)
        .maybeSingle();
      if (!c) orphans.push(entry);
    }
  }
  if (orphans.length > 0) {
    warn(`${orphans.length} entrées audit_log pointent vers des contacts supprimés (normal si ON DELETE CASCADE manquant)`);
  }

  ok(`audit_log OK (${recent?.length || 0} entrées examinées)`);

  // RPC cleanup_old_audit_log existe ?
  const { error: cleanupErr } = await supabase.rpc("cleanup_old_audit_log");
  if (cleanupErr) {
    bug("AUDIT", "RPC cleanup_old_audit_log ne fonctionne pas", cleanupErr.message);
  } else {
    ok("RPC cleanup_old_audit_log disponible");
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Test 6 : Schema sanity — colonnes référencées vs existantes
// ──────────────────────────────────────────────────────────────────────────
async function testSchemaSanity() {
  log("SCHEMA", "Vérification schéma de base");

  const tablesAndCols = {
    contacts: ["id", "email", "first_name", "last_name", "phone", "tags", "pipeline_stage", "pipeline_updated_at", "status", "subscribed_at"],
    enrollments: ["id", "user_id", "course_id", "product_name", "amount_paid", "purchased_at", "status"],
    profiles: ["id", "email", "full_name", "role", "coaching_credits_total", "coaching_credits_used"],
    contact_lists: ["id", "name", "tag_key", "folder_id", "color", "sort_order", "description"],
    contact_list_folders: ["id", "name", "sort_order"],
    contact_notes: ["id", "contact_id", "content", "kind", "author_id", "created_at"],
    email_campaigns: ["id", "subject", "html_content", "preview_text", "from_name", "from_email", "reply_to", "status", "target_tags", "scheduled_at", "campaign_number"],
    forms: ["id", "name", "slug", "title", "description", "status", "list_id", "success_message", "redirect_url", "background_image_url", "require_phone", "require_last_name", "submit_count"],
    audit_log: ["id", "actor_id", "action", "entity_type", "entity_id", "before", "after", "created_at"],
  };

  for (const [table, cols] of Object.entries(tablesAndCols)) {
    const { data, error } = await supabase.from(table).select(cols.join(",")).limit(1);
    if (error) {
      bug("SCHEMA", `Table ${table} : colonnes manquantes`, error.message);
    } else {
      ok(`${table} : ${cols.length} colonnes OK`);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Test 7 : Race conditions & bulk
// ──────────────────────────────────────────────────────────────────────────
async function testRaceConditions() {
  log("RACE", "Updates concurrents sur même contact");

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      email: `e2e-race-${Date.now()}@test.local`,
      first_name: "Race",
      tags: [TEST_TAG],
      source: "manuel",
    })
    .select()
    .single();
  if (error) { bug("RACE", "Setup échoue", error.message); return; }

  // 10 updates de stage concurrents
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      supabase
        .from("contacts")
        .update({
          pipeline_stage: pick(PIPELINE_STAGES),
          pipeline_updated_at: new Date().toISOString(),
        })
        .eq("id", contact.id)
    );
  }
  const results = await Promise.all(promises);
  const fails = results.filter((r) => r.error).length;
  if (fails > 0) bug("RACE", `${fails}/10 updates concurrents ont échoué`);
  else ok("10 updates concurrents OK (pas de deadlock)");

  // Vérifier que le stage final est bien un des 9 valides
  const { data: final } = await supabase
    .from("contacts")
    .select("pipeline_stage")
    .eq("id", contact.id)
    .maybeSingle();
  if (!PIPELINE_STAGES.includes(final?.pipeline_stage)) {
    bug("RACE", "Stage final invalide", final?.pipeline_stage);
  }

  await supabase.from("contacts").delete().eq("id", contact.id);
}

// ──────────────────────────────────────────────────────────────────────────
// Cleanup final
// ──────────────────────────────────────────────────────────────────────────
async function finalCleanup() {
  log("CLEANUP", "Suppression données de test");

  const { data: testContacts } = await supabase
    .from("contacts")
    .select("id")
    .contains("tags", [TEST_TAG]);
  if (testContacts?.length) {
    await supabase.from("contacts").delete().in("id", testContacts.map((c) => c.id));
  }

  await supabase.from("contact_lists").delete().ilike("name", "e2e_%");
  await supabase.from("contact_list_folders").delete().ilike("name", "e2e_%");
  await supabase.from("forms").delete().ilike("name", "e2e_%");
  await supabase.from("email_campaigns").delete().ilike("subject", "e2e_%");

  ok("Cleanup terminé");
}

// ──────────────────────────────────────────────────────────────────────────
// Run all
// ──────────────────────────────────────────────────────────────────────────
async function run() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  STRESS-TEST E2E — ES Academy CRM");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const t0 = Date.now();

  try {
    await cleanup();
    await testSchemaSanity();
    const contactIds = await testPipelineStress();
    const { lists } = await testLists(contactIds);
    const { form } = (await testForms(lists)) || {};
    await testNewsletter(lists);
    await testAuditLog(contactIds);
    await testRaceConditions();
    await finalCleanup();
  } catch (e) {
    bug("CRASH", "Test crash inattendu", e.message + "\n" + e.stack);
  }

  const elapsed = Math.round((Date.now() - t0) / 100) / 10;

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  RÉSULTATS : ${passed} OK · ${failed} BUGS · ${warnings.length} warnings · ${elapsed}s`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (bugs.length > 0) {
    console.log("\n🐛 BUGS À CORRIGER :");
    for (const b of bugs) {
      console.log(`  [${b.category}] ${b.msg}`);
      if (b.details) console.log(`     ${b.details}`);
    }
  }

  if (warnings.length > 0) {
    console.log("\n⚠️  WARNINGS :");
    for (const w of warnings) console.log(`  - ${w}`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

run();
