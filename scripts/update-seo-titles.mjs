#!/usr/bin/env node
/**
 * Update les SEO titles trop longs dans Notion (21 articles).
 *
 * Propositions editoriales (pas juste tronquer) : on garde le mot-cle au debut,
 * on enleve le superflu, on cible 45-58 chars.
 *
 * Usage : node scripts/update-seo-titles.mjs [--dry-run]
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

if (!NOTION_KEY || !BLOG_DB) {
  console.error("NOTION_API_KEY ou NOTION_BLOG_DB manquant");
  process.exit(1);
}

// Mapping slug -> new SEO title (editorial, garde le mot-cle, vise 45-58 chars)
const NEW_TITLES = {
  "4-astuces-pour-booster-son-scoring-bancaire-rapidement": "4 astuces pour booster son scoring bancaire",
  "5-villes-ou-investir-petit-budget-sud-france": "5 villes pour investir petit budget dans le Sud",
  "6-conseils-entretenir-appartement-avant-louer": "6 conseils pour entretenir un appartement avant location",
  "6-outils-terrain-pratiques-investisseurs-immobiliers": "6 outils terrain pour investisseurs immobiliers",
  "8-films-inspirants-booster-motivation": "8 films inspirants pour booster ta motivation",
  "avantages-sci-guide-complet-investissement": "Avantages d'une SCI : guide complet 2026",
  "chouchouter-chaudiere-eviter-mauvaises-surprises": "Entretenir sa chaudière : guide anti pannes",
  "comment-reduire-frais-notaire-achat-immobilier": "Comment réduire les frais de notaire en immobilier",
  "credit-immobilier-3-elements-seduire-banque": "Crédit immobilier : 3 éléments pour séduire ta banque",
  "crise-logement-france-gouvernement-2025": "Crise du logement : ce que propose le gouvernement",
  "differe-bancaire-cerise-gateau-credit-immobilier": "Différé bancaire immobilier : pourquoi le demander",
  "grand-paris-express-timing-investir-avant-2030": "Grand Paris Express : investir avant 2030",
  "investir-immobilier-boulogne-sur-mer-marche-locatif": "Investir à Boulogne-sur-Mer : étude marché locatif",
  "investir-immobilier-champigny-sur-marne": "Investir à Champigny-sur-Marne : marché locatif 2026",
  "investir-immobilier-locatif-espagne": "Investir en immobilier en Espagne : bonne idée ?",
  "investir-immobilier-pied-pistes-ski": "Investir au pied des pistes de ski : bon plan ?",
  "investir-immobilier-pres-paris-secteurs-2026": "Investir près de Paris : les secteurs à cibler 2026",
  "investir-immobilier-saint-nazaire-marche-locatif": "Investir à Saint-Nazaire : étude marché locatif",
  "reussir-visite-immobiliere-conseils-astuces": "Réussir sa visite immobilière : conseils essentiels",
  "success-story-studio-delabre-pepite-rentable": "Success story : studio délabré devenu pépite rentable",
  "tendances-deco-2025-inspirations-interieur": "Tendances déco 2026 : 5 inspirations intérieur",
};

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

// 1. List all articles (published = true) avec leur slug + page_id
console.log(`→ Fetch ${Object.keys(NEW_TITLES).length} articles Notion par slug...`);
const slugs = Object.keys(NEW_TITLES);
const slugToPage = new Map();

const data = await notion(`/databases/${BLOG_DB}/query`, "POST", {
  filter: { and: [{ property: "Published", checkbox: { equals: true } }] },
  page_size: 100,
});

for (const page of data.results || []) {
  const props = page.properties || {};
  const slug = (props.Slug?.rich_text?.[0]?.plain_text || "").trim();
  if (slugs.includes(slug)) {
    const currentSeoTitle = props.SEO_Title?.rich_text?.[0]?.plain_text || "";
    slugToPage.set(slug, { id: page.id, currentSeoTitle });
  }
}

console.log(`→ Trouve ${slugToPage.size}/${slugs.length} articles dans Notion`);
const missing = slugs.filter((s) => !slugToPage.has(s));
if (missing.length > 0) {
  console.log(`⚠ Articles introuvables : ${missing.join(", ")}`);
}

// 2. Update each article's SEO_Title
let ok = 0, failed = 0;
for (const [slug, newTitle] of Object.entries(NEW_TITLES)) {
  const page = slugToPage.get(slug);
  if (!page) {
    console.log(`  ⚠ ${slug} : pas trouve, skip`);
    continue;
  }
  if (page.currentSeoTitle === newTitle) {
    console.log(`  − ${slug} : deja a jour (${newTitle.length}c), skip`);
    ok++;
    continue;
  }
  if (DRY_RUN) {
    console.log(`  [DRY] ${slug}: "${page.currentSeoTitle}" → "${newTitle}" (${newTitle.length}c)`);
    ok++;
    continue;
  }
  try {
    await notion(`/pages/${page.id}`, "PATCH", {
      properties: {
        SEO_Title: {
          rich_text: [{ type: "text", text: { content: newTitle } }],
        },
      },
    });
    console.log(`  ✓ ${slug} (${newTitle.length}c)`);
    ok++;
  } catch (e) {
    console.log(`  ✗ ${slug}: ${e.message.slice(0, 80)}`);
    failed++;
  }
  await new Promise((r) => setTimeout(r, 200)); // pause Notion rate limit
}

console.log(`\n→ ${ok} OK, ${failed} echecs`);
if (DRY_RUN) console.log("(dry-run, aucune ecriture)");
