#!/usr/bin/env node
/**
 * Test end-to-end du webhook Calendly Academy.
 *
 * Pour chaque event_type Calendly reel, construit un payload invitee.created
 * signe HMAC-SHA256 et le POST vers /api/webhooks/calendly. Verifie la
 * reponse et liste les tags appliques.
 *
 * Usage :
 *   CALENDLY_WEBHOOK_SIGNING_KEY=<key> SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> \
 *     node scripts/test-calendly-webhook.mjs [--url=https://emeline-siron.fr/api/webhooks/calendly] [--cleanup]
 *
 * Options :
 *   --url=...     Endpoint cible (defaut prod)
 *   --cleanup     Supprime les contacts de test apres verification
 *   --only=name   Ne teste qu'un seul event (substring sur name)
 */

import crypto from "node:crypto";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (!a.startsWith("--")) return [a, true];
    const eq = a.indexOf("=");
    if (eq === -1) return [a.slice(2), true];
    return [a.slice(2, eq), a.slice(eq + 1)];
  }),
);

const SIGNING_KEY = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
if (!SIGNING_KEY) {
  console.error("CALENDLY_WEBHOOK_SIGNING_KEY manquant");
  process.exit(1);
}
const ENDPOINT = args.url || "https://emeline-siron.fr/api/webhooks/calendly";

const HOST_ANTONY = "antony@es-academy.fr";
const HOST_EMELINE = "emeline@es-academy.fr";

const EVENTS = [
  {
    name: "On parle de ton projet immo (Newsletter)",
    host: HOST_ANTONY,
    expectedTags: ["rdv-calendly-pris", "source:newsletter", "closer:antony"],
  },
  {
    name: "On parle de ton projet immo (Podcast)",
    host: HOST_ANTONY,
    expectedTags: ["rdv-calendly-pris", "source:podcast", "closer:antony"],
  },
  {
    name: "On parle de ton projet immo (LinkedIn)",
    host: HOST_ANTONY,
    expectedTags: ["rdv-calendly-pris", "source:linkedin", "closer:antony"],
  },
  {
    name: "On parle de ton projet immo (Instagram)",
    host: HOST_ANTONY,
    expectedTags: ["rdv-calendly-pris", "source:instagram", "closer:antony"],
  },
  {
    name: "On parle de ton projet immo (Cahier de vacances)",
    host: HOST_ANTONY,
    expectedTags: ["rdv-calendly-pris", "source:cahier-vacances", "closer:antony"],
  },
  {
    name: "On parle de ton projet immo (Site internet)",
    host: HOST_ANTONY,
    expectedTags: ["rdv-calendly-pris", "source:site", "closer:antony"],
  },
  {
    name: "On parle de ton projet immo (Academy)",
    host: HOST_ANTONY,
    expectedTags: ["rdv-calendly-pris", "source:academy-post-achat", "closer:antony"],
  },
  {
    name: "Coaching ES Academy (package)",
    host: HOST_EMELINE,
    expectedTags: ["rdv-calendly-pris", "coaching:package", "host:emeline"],
  },
  {
    name: "Coaching session ES Academy",
    host: HOST_EMELINE,
    expectedTags: ["rdv-calendly-pris", "coaching:session", "host:emeline"],
  },
  {
    name: "Session coaching eleve formation",
    host: HOST_EMELINE,
    expectedTags: ["rdv-calendly-pris", "coaching:eleve", "host:emeline"],
  },
];

function buildPayload(event, runId, idx) {
  const ts = Math.floor(Date.now() / 1000);
  const inviteeId = `${runId}-${idx}`;
  return {
    event: "invitee.created",
    created_at: new Date(ts * 1000).toISOString(),
    payload: {
      uri: `https://api.calendly.com/scheduled_events/test-${inviteeId}/invitees/inv-${inviteeId}`,
      email: `test-calendly-${inviteeId}@es-academy.test`,
      first_name: "Test",
      last_name: `Calendly${idx}`,
      name: `Test Calendly${idx}`,
      text_reminder_number: null,
      questions_and_answers: [],
      scheduled_event: {
        uri: `https://api.calendly.com/scheduled_events/test-${inviteeId}`,
        name: event.name,
        start_time: new Date(Date.now() + 86400000).toISOString(),
        end_time: new Date(Date.now() + 86400000 + 1800000).toISOString(),
        event_memberships: [
          { user_email: event.host, user_name: event.host.split("@")[0] },
        ],
      },
      tracking: {},
    },
  };
}

function sign(rawBody) {
  const t = Math.floor(Date.now() / 1000);
  const signed = `${t}.${rawBody}`;
  const v1 = crypto.createHmac("sha256", SIGNING_KEY).update(signed).digest("hex");
  return `t=${t},v1=${v1}`;
}

const runId = Date.now().toString(36);
const toRun = args.only
  ? EVENTS.filter((e) => e.name.toLowerCase().includes(args.only.toLowerCase()))
  : EVENTS;

console.log(`Run ID : ${runId}`);
console.log(`Endpoint : ${ENDPOINT}`);
console.log(`Events a tester : ${toRun.length}\n`);

const results = [];
for (let i = 0; i < toRun.length; i++) {
  const ev = toRun[i];
  const payload = buildPayload(ev, runId, i);
  const rawBody = JSON.stringify(payload);
  const signature = sign(rawBody);

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Calendly-Webhook-Signature": signature,
    },
    body: rawBody,
  });
  const json = await res.json().catch(() => ({}));

  const status = res.status === 200 ? "OK " : "KO ";
  const tagsBack = (json.tags_added || []).sort().join(", ");
  const expected = ev.expectedTags.sort().join(", ");
  const match = tagsBack === expected ? "MATCH" : "DIFF ";
  console.log(`${status} ${match}  ${ev.name}`);
  if (tagsBack !== expected) {
    console.log(`     expected : ${expected}`);
    console.log(`     got      : ${tagsBack}`);
    console.log(`     response : ${JSON.stringify(json)}`);
  }
  results.push({ event: ev.name, status: res.status, expected, got: tagsBack, json });
}

const allOk = results.every((r) => r.status === 200 && r.got === r.expected);
console.log(`\n=== ${allOk ? "TOUS OK" : "ECHECS PRESENTS"} ===`);
console.log(`Emails de test crees (prefix test-calendly-${runId}- @es-academy.test)`);

if (args.cleanup) {
  console.log("\nCleanup demande, mais necessite SUPABASE_SERVICE_ROLE_KEY pour supprimer les contacts.");
  console.log("Lancer manuellement : DELETE FROM contacts WHERE email LIKE 'test-calendly-%@es-academy.test';");
}

process.exit(allOk ? 0 : 1);
