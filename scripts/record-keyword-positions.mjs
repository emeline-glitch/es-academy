#!/usr/bin/env node
/**
 * Enregistre les positions Google des 6 mots-cles prioritaires (priority=1).
 *
 * Methode : SERP check manuel via WebSearch. Le site emeline-siron.fr etant tout
 * neuf (lance ~mai 2026), aucun mot-cle n'apparait dans le top 10 Google. On note
 * position=null + notes detaillees + last_checked_at=now() pour satisfaire la
 * reco "keyword_never_checked" et avoir une baseline de demarrage.
 *
 * Quand la GSC API sera debloquee (org policy), un cron remplacera ce script.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");

function loadEnv() {
  const content = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
  process.exit(1);
}

// Resultats SERP manual check (12 mai 2026)
// Note : Google ne renvoie pas la position exacte au-dela du top 10/page 1.
// Format : position=null = pas dans le top 10 visible, ce qui correspond a une
// position >10. On garde position=null pour ne pas mentir avec une valeur fixe.
const SERP_CHECKS = [
  {
    keyword: "emeline siron",
    position: null,
    notes: "12 mai 2026 - SERP domine par Instagram/YouTube/Evermind/LinkedIn. emeline-siron.fr pas en top 10. Domaine neuf, indexation en cours.",
  },
  {
    keyword: "autofinancement immobilier",
    position: null,
    notes: "12 mai 2026 - Top 10 : Cafpi, investissement-locatif.com, Masteos, Horiz, Vallat, Pretto, MyExpat. Mot-cle tres concurrentiel. Le contenu /academy doit etre renforce (signature methode + autofinancement).",
  },
  {
    keyword: "methode emeline siron",
    position: null,
    notes: "12 mai 2026 - SERP capture par l'ancien site evermind.group et liebfine.com (review). Notre /academy doit reciver le trafic mais pas encore indexe sur ce terme. Action : article dedie 'La methode Emeline Siron' + ancres internes.",
  },
  {
    keyword: "investir immobilier sans apport",
    position: null,
    notes: "12 mai 2026 - Top 10 : Credit Agricole, Maif, Meilleurtaux, Vinci, Cafpi, manda.fr. Concurrence enorme (banques + comparateurs). Realiste : viser top 50 en 6 mois avec article dedie + backlinks OTB/Instagram.",
  },
  {
    keyword: "formation immobilier locatif",
    position: null,
    notes: "12 mai 2026 - Top 10 : Ataraxia, investissement-locatif.com, Greenbull, Bevouac, Finance Heros. Concurrence directe formations. /academy doit se positionner avec USP : 'autofinancement' + storytelling.",
  },
  {
    keyword: "formation investissement immobilier",
    position: null,
    notes: "12 mai 2026 - Top 10 : moncercleimmo, investissement-locatif.com, Cegos, Greenbull, INSEEC. Variant proche de 'formation immobilier locatif' mais legerement different (B2C generaliste). Meme strategie : SEO content + ads quand lancement.",
  },
];

async function supabase(path, method = "GET", body = null) {
  const res = await fetch(`${SUPA_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`Supabase ${path} HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

// 1. Fetch les IDs des 6 keywords priority=1
console.log("→ Fetch keyword IDs (priority=1)...");
const keywords = await supabase("/seo_target_keywords?priority=eq.1&select=id,keyword");
console.log(`→ Trouve ${keywords.length} keywords priority=1`);

const kwMap = new Map(keywords.map((k) => [k.keyword, k.id]));

// 2. Insert dans seo_keyword_history + update seo_target_keywords
const now = new Date().toISOString();
const today = new Date().toISOString().slice(0, 10);
const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

let ok = 0;
for (const check of SERP_CHECKS) {
  const id = kwMap.get(check.keyword);
  if (!id) {
    console.log(`  ⚠ ${check.keyword} : pas trouve dans la DB, skip`);
    continue;
  }

  // Insert dans history
  await supabase("/seo_keyword_history", "POST", {
    keyword_id: id,
    position: check.position,
    impressions: null,
    clicks: null,
    ctr: null,
    period_start: weekAgo,
    period_end: today,
    source: "manual",
    notes: check.notes,
  });

  // Update current sur seo_target_keywords
  await supabase(`/seo_target_keywords?id=eq.${id}`, "PATCH", {
    last_checked_at: now,
    current_position: check.position,
  });

  console.log(`  ✓ ${check.keyword}`);
  ok++;
}

console.log(`\n→ ${ok}/${SERP_CHECKS.length} positions enregistrees`);
