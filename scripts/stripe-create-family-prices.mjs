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

const product = await stripe.products.create({
  name: "ES Family",
  description: "Communaute ES Family - acces plateforme + app",
  metadata: { slug: "es-family", scope: "family" },
});

const priceFondateur = await stripe.prices.create({
  product: product.id,
  currency: "eur",
  unit_amount: 50000,
  nickname: "ES Family - Fondateur (500 EUR a vie, one-shot)",
  metadata: { tier: "fondateur", cap: "unlimited", billing: "one_time" },
});

const priceStandard = await stripe.prices.create({
  product: product.id,
  currency: "eur",
  unit_amount: 2900,
  recurring: { interval: "month", interval_count: 1 },
  nickname: "ES Family - Standard (29 EUR/mois)",
  metadata: { tier: "standard", billing: "monthly" },
});

console.log("\n=== ES Family ===");
console.log(`Product ID            : ${product.id}`);
console.log(`Price Fondateur (1x)  : ${priceFondateur.id}`);
console.log(`Price Standard (mois) : ${priceStandard.id}`);
