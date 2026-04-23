#!/usr/bin/env node
import Stripe from "stripe";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
const secret = env.match(/^STRIPE_SECRET_KEY=(.+)$/m)?.[1]?.trim();

const stripe = new Stripe(secret, { apiVersion: "2026-03-25.dahlia" });

const evermindPromo = await stripe.promotionCodes.create({
  promotion: { type: "coupon", coupon: "EVERMIND" },
  code: "EVERMIND",
  max_redemptions: 2000,
  metadata: {
    scope: "alumni_migration",
    protection: "whitelist_email_cote_api",
  },
});

console.log(`\nPromotion Code cree : ${evermindPromo.code}`);
console.log(`ID                  : ${evermindPromo.id}`);
console.log(`Max redemptions     : ${evermindPromo.max_redemptions}`);
