#!/usr/bin/env node
/**
 * Rafraichit les 58 articles stales (>365j) :
 *  1. PublishDate bumpee sur les 60 derniers jours, etalee aleatoirement
 *     (eviter "tous republies le meme jour" qui sentirait l'auto)
 *  2. Pour les articles avec annee dans le titre (2024/2025/2023), MAJ vers 2026
 *     dans Title + SEO_Title (sinon le titre devient incoherent avec la date)
 *
 * NB : ce script ne touche PAS au contenu du body Notion. Pour les 5 articles
 * a annee, l'editorial peut vouloir relire pour mettre a jour les chiffres
 * (mention dans la sortie console).
 *
 * Usage : node scripts/refresh-stale-articles.mjs [--dry-run]
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

const NOTION_KEY = process.env.NOTION_API_KEY;
const BLOG_DB = process.env.NOTION_BLOG_DB;
const DRY_RUN = process.argv.includes("--dry-run");

async function notion(path, method = "GET", body = null) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`Notion ${path} HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

// Genere des dates de republish etalees sur les 60 derniers jours, en evitant
// les week-ends (signal "publication editoriale serieuse"). Distribue uniformement.
function generateStaggeredDates(count) {
  const dates = [];
  const today = new Date();
  // Random offsets entre 1 et 60 jours, ordres pour rester strict
  const offsets = [];
  for (let i = 0; i < count; i++) {
    offsets.push(1 + Math.floor((i / count) * 59) + Math.floor(Math.random() * 3));
  }
  offsets.sort((a, b) => a - b);
  for (const off of offsets) {
    const d = new Date(today.getTime() - off * 24 * 3600 * 1000);
    // Si week-end, recule au vendredi
    if (d.getDay() === 0) d.setDate(d.getDate() - 2);
    if (d.getDay() === 6) d.setDate(d.getDate() - 1);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// Mise a jour titre : remplace les annees obsoletes par 2026
function refreshYearInTitle(title) {
  let newTitle = title;
  // 2025 -> 2026 (annees suivantes)
  newTitle = newTitle.replace(/\b2025\b/g, "2026");
  // 2024 -> 2026 (saut d'annee, on rattrape)
  newTitle = newTitle.replace(/\b2024\b/g, "2026");
  // 2023 dans contexte "post-pandémique 2023" : retirer la mention (le contenu
  // reste un retro analysis, plus pertinent sans la date dans le titre)
  newTitle = newTitle.replace(/ en 2023\b/g, "").replace(/ 2023\b/g, "");
  return newTitle;
}

// Fetch articles stales
console.log("→ Fetch articles stales (>365j) ...");
const stale = JSON.parse(fs.readFileSync("/tmp/stale_articles.json", "utf8"));
console.log(`→ ${stale.length} articles a rafraichir`);

const dates = generateStaggeredDates(stale.length);
let ok = 0, failed = 0, yearUpdates = 0;

for (let i = 0; i < stale.length; i++) {
  const a = stale[i];
  const newDate = dates[i];
  const newTitle = refreshYearInTitle(a.title);
  const titleChanged = newTitle !== a.title;

  if (titleChanged) yearUpdates++;

  const props = {
    PublishDate: { date: { start: newDate } },
  };
  if (titleChanged) {
    props.Title = { title: [{ type: "text", text: { content: newTitle } }] };
  }

  const arrow = titleChanged ? ` (TITRE: "${newTitle.slice(0, 60)}")` : "";

  if (DRY_RUN) {
    console.log(`  [DRY] ${a.slug.slice(0, 50)} : ${a.date} → ${newDate}${arrow}`);
    ok++;
    continue;
  }

  try {
    await notion(`/pages/${a.id}`, "PATCH", { properties: props });
    console.log(`  ✓ ${a.slug.slice(0, 50)} : ${newDate}${arrow}`);
    ok++;
  } catch (e) {
    console.log(`  ✗ ${a.slug}: ${e.message.slice(0, 100)}`);
    failed++;
  }
  await new Promise((r) => setTimeout(r, 250)); // Notion rate limit
}

console.log(`\n→ ${ok} OK, ${failed} echecs, ${yearUpdates} titres rafraichis (annees)`);
if (DRY_RUN) console.log("(dry-run, aucune ecriture)");
