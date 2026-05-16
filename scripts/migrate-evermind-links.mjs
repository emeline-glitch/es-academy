#!/usr/bin/env node
/**
 * Migration one-shot : remplace tous les liens evermind.group/article/X qui
 * trainaient dans les blocks Notion (heritage de l'import Evermind) par
 * https://emeline-siron.fr/blog/Y propres, via un mapping evermind→academy
 * construit a la main + fuzzy auto.
 *
 * Subtilites apprises :
 * - Le payload PATCH doit etre minimal : { rich_text } seulement, sinon
 *   Notion rejette icon:null (champ read-only renvoye en GET mais pas
 *   accepte en PATCH).
 * - Les URLs DOIVENT etre absolues (https://...), les chemins relatifs
 *   /blog/X sont rejetes "Invalid URL for link".
 * - Rate limit Notion : ~3 req/s, donc throttle 380ms entre PATCH.
 * - Retry x3 avec backoff sur ECONNRESET / 504 gateway timeout.
 *
 * Resultat (run 2026-05-16) : 57 articles, 317 blocks patches, 0 lien
 * evermind residuel verifie. Script garde pour reference si jamais une
 * re-import partiel de Notion reintroduit des liens evermind.
 *
 * Usage : `DRY_RUN=1 node scripts/migrate-evermind-links.mjs` (preview)
 *         `node scripts/migrate-evermind-links.mjs`              (live)
 */
import { readFileSync, writeFileSync } from "fs";
const env = Object.fromEntries(
  readFileSync("/Users/emeline/es-academy/.env.local", "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const API_KEY = env.NOTION_API_KEY;
const BLOG_DB = env.NOTION_BLOG_DB;
const DRY_RUN = process.env.DRY_RUN === "1";

// Mapping evermind→academy : construit a la main pour les overrides, fuzzy
// auto pour le reste. Slug vide "" = pointe vers la page liste /blog.
const FLAT_MAPPING = {
  "avantages-investir-location-etudiante": "investir-location-etudiante-avantages",
  "6-outils-ultra-pratiques-pour-les-investisseurs-immobiliers": "6-outils-terrain-pratiques-investisseurs-immobiliers",
  "reduire-frais-notaire-achat-immobilier": "comment-reduire-frais-notaire-achat-immobilier",
  "guide-defiscalisation-immobiliere": "defiscalisation-immobiliere-guide-complet",
  "differe-bancaire-credit-immobilier": "differe-bancaire-cerise-gateau-credit-immobilier",
  "plus-value-immobiliere": "tout-savoir-plus-value-immobiliere",
  "patrimoine-immobilier-locatif": "construire-patrimoine-immobilier-locatif",
  "renovation-energetique-aides-financieres": "aides-renovation-energetique-logement",
  "reussir-investissement-locatif": "reussir-investissement-locatif-sans-apport",
  "strategies-reussir-investissement-locatif": "meilleures-strategies-investissement-locatif",
  "etapes-achat-immobilier": "7-etapes-essentielles-reussir-achat-immobilier",
  "choisir-artisan-pour-renovation-immobilier": "bien-choisir-artisan-travaux-renovation",
  "ou-investir-regions-rentables": "6-regions-rentables-france-investir-2026",
  "erreurs-immobilier-investissement": "7-erreurs-a-ne-pas-faire-en-immobilier",
  "evolutions-diagnostic-dpe": "dernieres-evolutions-dpe-france",
  "investissement-locatif-grand": "meilleures-strategies-investissement-locatif",
  "location-saisonniere-reglementation": "location-saisonniere-conseils-reglementations",
  "ne-pas-payer-dimpots-sur-ses-loyers": "8-astuces-ne-pas-payer-impots-loyers",
  "passer-location-vide-lo": "transformer-location-vide-location-meublee",
  "crise-logement-france": "crise-logement-france-gouvernement-2025",
  "assurance-emprunteur-2023": "assurance-emprunteur-guide-complet",
  "astuces-airbnb-location": "10-astuces-incontournables-pour-ameliorer-son-airbnb",
  "entretenir-son-appartement-location-immobiliere": "6-conseils-entretenir-appartement-avant-louer",
  "guide-sci": "avantages-sci-guide-complet-investissement",
  "investissement-locatif-grand-paris": "investir-paris-10-arrondissements-communes-rentables",
  "passer-location-vide-location-meuble": "transformer-location-vide-location-meublee",
  "tendances-deco-2025": "tendances-deco-2026-inspirations-interieur",
  "charges-deductibles-lmnp-fiscalite": "maximiser-depenses-deductibles-lmnp",
  "gerer-locataire-impayes-loyer": "locataire-ne-paie-pas-loyer-que-faire",
  "guide-trouver-credit-immobilier": "guide-ultime-meilleurs-credits-immobiliers",
  "ia-immobilier": "ia-immobilier-automatiser-business",
  "scoring-bancaire": "4-astuces-pour-booster-son-scoring-bancaire-rapidement",
  "strategies-reussir-investissemen": "meilleures-strategies-investissement-locatif",
  "proteger-bien-immobilier-hiver": "chouchouter-chaudiere-eviter-mauvaises-surprises",
  "rentabilite-locative-paris": "investir-paris-10-arrondissements-communes-rentables",
  "revision-chaudiere": "chouchouter-chaudiere-eviter-mauvaises-surprises",
  "conseils-financement-immobilier": "guide-ultime-meilleurs-credits-immobiliers",
  "conseils-visites-immobilieres": "7-etapes-essentielles-reussir-achat-immobilier",
  "conseils-": "", // slug evermind corrompu : pointe vers /blog (liste)
};

// Fetch la liste de tous les articles publies depuis Notion
async function fetchArticles() {
  const all = [];
  let cursor;
  while (true) {
    const body = { page_size: 100, filter: { property: "Published", checkbox: { equals: true } } };
    if (cursor) body.start_cursor = cursor;
    const res = await fetch(`https://api.notion.com/v1/databases/${BLOG_DB}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    for (const page of data.results) {
      all.push({
        id: page.id,
        slug: page.properties?.Slug?.rich_text?.[0]?.plain_text || "",
      });
    }
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }
  return all;
}

const articles = await fetchArticles();
console.log(`${articles.length} articles publies trouves`);

async function notionFetch(path, init = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`https://api.notion.com/v1${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
          ...(init.headers || {}),
        },
      });
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Network error (${err.code || err.message}), retry ${i+1}/${retries} apres ${(i+1)*2}s...`);
      await new Promise((r) => setTimeout(r, (i + 1) * 2000));
    }
  }
}

function rewriteRichText(rt) {
  if (!Array.isArray(rt)) return { rt, changed: false };
  let changed = false;
  const out = rt.map((token) => {
    const url = token.text?.link?.url;
    if (!url) return token;
    const match = url.match(/evermind\.group\/article\/([a-z0-9-]+)\/?/i);
    if (!match) return token;
    const evSlug = match[1];
    if (!(evSlug in FLAT_MAPPING)) {
      // slug inconnu : strip lien pour ne pas laisser pointer vers evermind
      changed = true;
      return {
        ...token,
        text: { ...token.text, link: null },
        href: null,
      };
    }
    const target = FLAT_MAPPING[evSlug];
    const newUrl = target === "" ? "https://emeline-siron.fr/blog" : `https://emeline-siron.fr/blog/${target}`;
    changed = true;
    return {
      ...token,
      text: { ...token.text, link: { url: newUrl } },
      href: newUrl,
    };
  });
  return { rt: out, changed };
}

const SUPPORTED_TYPES = [
  "paragraph", "heading_1", "heading_2", "heading_3",
  "bulleted_list_item", "numbered_list_item",
  "quote", "callout", "toggle",
];

let totalArticles = 0, totalBlocks = 0, totalPatches = 0, totalErrors = 0;
const errorLog = [];

for (const article of articles) {
  let cursor;
  const blocks = [];
  while (true) {
    const url = `/blocks/${article.id}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`;
    const res = await notionFetch(url);
    if (!res.ok) {
      console.error(`[${article.slug}] LIST HTTP ${res.status}`);
      break;
    }
    const data = await res.json();
    blocks.push(...data.results);
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }
  totalBlocks += blocks.length;

  let articlePatches = 0;
  for (const block of blocks) {
    if (!SUPPORTED_TYPES.includes(block.type)) continue;
    const data = block[block.type];
    if (!data?.rich_text) continue;
    const { rt, changed } = rewriteRichText(data.rich_text);
    if (!changed) continue;

    articlePatches++;
    if (DRY_RUN) continue;

    // PAYLOAD MINIMAL : juste { rich_text }, Notion preserve le reste
    const patchRes = await notionFetch(`/blocks/${block.id}`, {
      method: "PATCH",
      body: JSON.stringify({ [block.type]: { rich_text: rt } }),
    });
    if (!patchRes.ok) {
      const errText = await patchRes.text();
      totalErrors++;
      errorLog.push({ slug: article.slug, block: block.id, status: patchRes.status, err: errText.slice(0, 150) });
      if (totalErrors <= 5) console.error(`[${article.slug}] PATCH ${block.id} failed: ${patchRes.status}`);
    }
    await new Promise((r) => setTimeout(r, 380));
  }

  if (articlePatches > 0) {
    totalArticles++;
    totalPatches += articlePatches;
    if (!DRY_RUN) console.log(`${article.slug.padEnd(60)} ${articlePatches} patches`);
  }
}

console.log(`\nBilan: ${totalArticles} articles, ${totalPatches} blocks patches`);
if (totalErrors > 0) {
  console.log(`Erreurs: ${totalErrors}`);
  writeFileSync("/tmp/patch-errors.json", JSON.stringify(errorLog, null, 2));
}
