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

const academyGift = await stripe.coupons.create({
  id: "ACADEMY_3_MOIS_FAMILY",
  name: "3 mois Family - cadeau Academy",
  percent_off: 100,
  duration: "repeating",
  duration_in_months: 3,
  metadata: {
    scope: "family",
    trigger: "academy_purchase",
    gift_type: "trial_3_months",
  },
});

const alumniGift = await stripe.coupons.create({
  id: "ALUMNI_12_MOIS_FAMILY",
  name: "12 mois Family - alumni Evermind",
  percent_off: 100,
  duration: "repeating",
  duration_in_months: 12,
  metadata: {
    scope: "family",
    trigger: "alumni_migration",
    gift_type: "trial_12_months",
  },
});

console.log("\n=== Coupons parents ES Family ===");
console.log(`Academy gift (3 mois)  : ${academyGift.id}`);
console.log(`Alumni gift  (12 mois) : ${alumniGift.id}`);
console.log("\nCes coupons serviront de 'parents' : a chaque achat Academy/migration alumni,");
console.log("notre webhook genere un Promotion Code unique (ex: ES-FAM-3M-AB12CD) qui pointe");
console.log("vers le coupon parent, avec max_redemptions=1 et lie au customer.\n");
