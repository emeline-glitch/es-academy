#!/usr/bin/env node
import Stripe from "stripe";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
const secret = env.match(/^STRIPE_SECRET_KEY=(.+)$/m)?.[1]?.trim();
if (!secret) throw new Error("STRIPE_SECRET_KEY introuvable dans .env.local");

const stripe = new Stripe(secret, { apiVersion: "2026-03-25.dahlia" });

const product = await stripe.products.create({
  name: "ES Academy - Formation",
  description: "Formation complete ES Academy (acces a vie)",
  metadata: { slug: "academy-formation", scope: "academy" },
});

const priceOneShot = await stripe.prices.create({
  product: product.id,
  currency: "eur",
  unit_amount: 99800,
  nickname: "Academy - 1x (998 EUR)",
  metadata: { installments: "1", plan: "one_shot" },
});

const price3x = await stripe.prices.create({
  product: product.id,
  currency: "eur",
  unit_amount: 33267,
  recurring: { interval: "month", interval_count: 1 },
  nickname: "Academy - 3x (332.67 EUR/mois, total 998.01 EUR)",
  metadata: { installments: "3", plan: "installments_3" },
});

const price4x = await stripe.prices.create({
  product: product.id,
  currency: "eur",
  unit_amount: 24950,
  recurring: { interval: "month", interval_count: 1 },
  nickname: "Academy - 4x (249.50 EUR/mois, total 998 EUR)",
  metadata: { installments: "4", plan: "installments_4" },
});

console.log("\n=== ES Academy Formation ===");
console.log(`Product ID       : ${product.id}`);
console.log(`Price 1x         : ${priceOneShot.id}`);
console.log(`Price 3x (mois)  : ${price3x.id}`);
console.log(`Price 4x (mois)  : ${price4x.id}`);
console.log("\nAjoute ces IDs dans .env.local.\n");
console.log("Note: pour 3x/4x, le checkout doit creer une Subscription Schedule");
console.log("qui s'arrete apres 3 (ou 4) iterations. Pas juste 'subscription' mode.");
