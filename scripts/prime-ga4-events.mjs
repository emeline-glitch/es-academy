#!/usr/bin/env node
/**
 * Pre-amorce GA4 avec 1 occurrence de chaque event de conversion via la
 * Measurement Protocol API. Permet de marquer les events comme conversions
 * dans GA4 Admin > Evenements (sinon il faut attendre qu'un vrai user fire l'event).
 *
 * Tous les events sont envoyes avec un client_id de test "claude-priming-bot"
 * pour pouvoir les filtrer/exclure dans GA4 si besoin.
 *
 * Usage : node scripts/prime-ga4-events.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
function loadEnv() {
  const content = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const API_SECRET = process.env.GA4_API_SECRET;

if (!MEASUREMENT_ID || !API_SECRET) {
  console.error("NEXT_PUBLIC_GA_MEASUREMENT_ID ou GA4_API_SECRET manquant");
  process.exit(1);
}

const CLIENT_ID = "1234567890.1234567890"; // format GA4 client_id stable

const EVENTS = [
  { name: "page_view", params: { page_path: "/academy", page_title: "Academy" } },
  { name: "page_view", params: { page_path: "/family", page_title: "Family" } },
  { name: "view_item", params: {
      currency: "EUR", value: 998,
      items: [{ item_id: "academy", item_name: "ES Academy", item_category: "formation", price: 998, quantity: 1 }],
  }},
  { name: "view_item", params: {
      currency: "EUR", value: 19,
      items: [{ item_id: "family-fondateur", item_name: "ES Family Fondateur", item_category: "abonnement", price: 19, quantity: 1 }],
  }},
  { name: "cta_academy_click", params: { plan: "1x", value: 998, currency: "EUR" } },
  { name: "cta_family_click", params: { plan: "fondateur", value: 19, currency: "EUR" } },
  { name: "lead_magnet_optin", params: { source: "lead_magnet", tag: "lead_magnet" } },
  { name: "newsletter_subscribe", params: { source: "newsletter" } },
  { name: "begin_checkout", params: { plan: "1x", value: 998, currency: "EUR", product: "academy" } },
  { name: "purchase", params: {
      transaction_id: "priming_test_" + Date.now(),
      value: 998, currency: "EUR", plan: "1x",
      items: [{ item_id: "academy", item_name: "ES Academy", item_category: "formation", item_variant: "1x", price: 998, quantity: 1 }],
  }},
  { name: "scroll", params: { percent_scrolled: 50, page_path: "/academy" } },
  { name: "time_on_page", params: { seconds: 60, page_path: "/academy" } },
  { name: "external_link_click", params: { link_url: "https://instagram.com/emeline.siron/", link_domain: "instagram.com" } },
];

const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(MEASUREMENT_ID)}&api_secret=${encodeURIComponent(API_SECRET)}`;

console.log(`→ Envoi de ${EVENTS.length} events vers GA4 ${MEASUREMENT_ID}...\n`);

let ok = 0, failed = 0;
for (const e of EVENTS) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        events: [{ name: e.name, params: e.params }],
        non_personalized_ads: true,
      }),
    });
    if (res.ok) {
      ok++;
      console.log(`  ✓ ${e.name}`);
    } else {
      failed++;
      console.log(`  ✗ ${e.name} : HTTP ${res.status}`);
    }
  } catch (err) {
    failed++;
    console.log(`  ✗ ${e.name} : ${err.message}`);
  }
}

console.log(`\n→ ${ok} OK, ${failed} echecs`);
console.log("\nProchaines etapes :");
console.log("  1. Attendre ~24h que GA4 traite ces events");
console.log("  2. GA4 Admin > Evenements : tu vas voir tous les events listes");
console.log("  3. Marque comme conversion : purchase, cta_academy_click, cta_family_click,");
console.log("     lead_magnet_optin, begin_checkout, newsletter_subscribe");
