#!/usr/bin/env node
import Stripe from "stripe";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
const secret = env.match(/^STRIPE_SECRET_KEY=(.+)$/m)?.[1]?.trim();
if (!secret) throw new Error("STRIPE_SECRET_KEY introuvable");

const stripe = new Stripe(secret, { apiVersion: "2026-03-25.dahlia" });

// 1. Archiver le price Fondateur 500 EUR one-time (obsolete)
const oldFondateur = await stripe.prices.update(
  "price_1TPKI48dcJH3D1uIN3pqSYnu",
  { active: false, metadata: { archived_reason: "replaced_by_19_eur_monthly" } }
);
console.log(`[ARCHIVE] Price 500 EUR one-time : ${oldFondateur.id} -> active=${oldFondateur.active}`);

// 2. Creer price Fondateur 19 EUR/mois (500 premieres places, limite en DB cote app)
const priceFondateur19 = await stripe.prices.create({
  product: "prod_UO6VkBHpR7mrA3",
  currency: "eur",
  unit_amount: 1900,
  recurring: { interval: "month", interval_count: 1 },
  nickname: "ES Family - Fondateur (19 EUR/mois, 500 premieres places)",
  metadata: {
    tier: "fondateur",
    cap: "500",
    billing: "monthly",
    note: "cap gere cote app, pas cote Stripe",
  },
});
console.log(`[CREATE] Price Fondateur 19 EUR/mois : ${priceFondateur19.id}`);

// 3. Supprimer l'ancien coupon alumni (12 mois)
try {
  const del = await stripe.coupons.del("ALUMNI_12_MOIS_FAMILY");
  console.log(`[DELETE] Coupon ALUMNI_12_MOIS_FAMILY : ${del.deleted}`);
} catch (e) {
  console.log(`[DELETE] Coupon ALUMNI_12_MOIS_FAMILY : already gone (${e.message})`);
}

// 4. Creer nouveau coupon alumni (6 mois, ID court)
const evermindCoupon = await stripe.coupons.create({
  id: "EVERMIND",
  name: "6 mois Family - alumni Evermind",
  percent_off: 100,
  duration: "repeating",
  duration_in_months: 6,
  metadata: {
    scope: "family",
    trigger: "alumni_migration",
    gift_type: "trial_6_months",
  },
});
console.log(`[CREATE] Coupon parent : ${evermindCoupon.id}`);

// 5. Creer Promotion Code public "EVERMIND" (partageable entre alumni,
//    la protection anti-non-alumni se fait cote API via whitelist email)
const evermindPromo = await stripe.promotionCodes.create({
  coupon: "EVERMIND",
  code: "EVERMIND",
  max_redemptions: 2000, // ~1900 alumni + buffer
  metadata: {
    scope: "alumni_migration",
    protection: "whitelist_email_cote_api",
  },
});
console.log(`[CREATE] Promotion Code public : ${evermindPromo.code} (id=${evermindPromo.id}, max=${evermindPromo.max_redemptions})`);

console.log("\n=== Resume ===");
console.log(`Price Fondateur 19 EUR/mois : ${priceFondateur19.id}`);
console.log(`Coupon Alumni (6 mois)      : EVERMIND`);
console.log(`Promo Code public           : EVERMIND (${evermindPromo.id})`);
console.log(`\n  -> Format code Academy gift cote webhook : "FAMILY" + 4 chars random`);
console.log(`     ex: FAMILY7K2P, FAMILYA8X3, etc. (10 chars, 1 mot)`);
console.log(`  -> max_redemptions=1 sur chaque code genere (impossible a partager)`);
