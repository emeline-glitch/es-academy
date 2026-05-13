#!/usr/bin/env node
/**
 * Enregistre le webhook Calendly v2 pour ES Academy.
 *
 * Etapes :
 * 1. Genere un signing key fort (32 bytes hex) cote local
 * 2. GET /users/me pour recuperer l'URI organization
 * 3. POST /webhook_subscriptions avec callback + signing_key + events
 * 4. Affiche la cle a ajouter dans .env.local et Vercel
 *
 * Usage :
 *   CALENDLY_PAT=<token> node scripts/calendly-register-webhook.mjs [--url=...]
 *
 * Le PAT se genere sur https://calendly.com/integrations/api_webhooks
 * (apres avoir cree un developer account, distinct du compte Teams).
 *
 * Options :
 *   --url=https://...     URL du webhook (defaut https://emeline-siron.fr/api/webhooks/calendly)
 *   --scope=user|organization   Portee du webhook (defaut user)
 *   --signing-key=<hex>   Force un signing key precis (sinon en genere un)
 *   --list                Liste les webhooks existants au lieu de creer
 *   --delete=<uri>        Supprime un webhook par son URI
 */

import crypto from "node:crypto";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq === -1) return [a.slice(2), true];
      return [a.slice(2, eq), a.slice(eq + 1)];
    }
    return [a, true];
  }),
);

const PAT = process.env.CALENDLY_PAT;
if (!PAT) {
  console.error("ERREUR : CALENDLY_PAT manquant dans l'env.");
  console.error("Genere un PAT sur https://calendly.com/integrations/api_webhooks");
  console.error("Puis relance avec : CALENDLY_PAT=<token> node scripts/calendly-register-webhook.mjs");
  process.exit(1);
}

const CALLBACK_URL = args.url || "https://emeline-siron.fr/api/webhooks/calendly";
const SCOPE = args.scope || "organization";
const EVENTS = ["invitee.created", "invitee.canceled"];

const headers = {
  Authorization: `Bearer ${PAT}`,
  "Content-Type": "application/json",
};

async function api(method, path, body) {
  const res = await fetch(`https://api.calendly.com${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    console.error(`[calendly ${method} ${path}] HTTP ${res.status}`);
    console.error(JSON.stringify(json, null, 2));
    process.exit(2);
  }
  return json;
}

const me = await api("GET", "/users/me");
const userUri = me.resource?.uri;
const orgUri = me.resource?.current_organization;
console.log("User URI         :", userUri);
console.log("Organization URI :", orgUri);

if (args.list) {
  const list = await api(
    "GET",
    `/webhook_subscriptions?organization=${encodeURIComponent(orgUri)}&scope=organization`,
  );
  console.log("\nWebhooks existants :");
  console.log(JSON.stringify(list, null, 2));
  process.exit(0);
}

if (args.delete) {
  const path = args.delete.startsWith("http")
    ? new URL(args.delete).pathname
    : args.delete;
  await api("DELETE", path);
  console.log(`Webhook supprime : ${args.delete}`);
  process.exit(0);
}

const signingKey = args["signing-key"] || crypto.randomBytes(32).toString("hex");

const payload = {
  url: CALLBACK_URL,
  events: EVENTS,
  organization: orgUri,
  scope: SCOPE,
  signing_key: signingKey,
};
if (SCOPE === "user") payload.user = userUri;

console.log("\nCreation du webhook subscription :");
console.log("  Callback :", CALLBACK_URL);
console.log("  Scope    :", SCOPE);
console.log("  Events   :", EVENTS.join(", "));

const created = await api("POST", "/webhook_subscriptions", payload);
console.log("\n=== WEBHOOK CREE ===");
console.log(JSON.stringify(created, null, 2));

console.log("\n=== A AJOUTER DANS .env.local ET VERCEL ===");
console.log(`CALENDLY_WEBHOOK_SIGNING_KEY=${signingKey}`);
console.log("\nWebhook URI (a garder pour le supprimer plus tard) :");
console.log(`  ${created.resource?.uri}`);
