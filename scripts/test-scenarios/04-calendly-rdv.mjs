#!/usr/bin/env node
/**
 * Scenario 04 : Prise de RDV Calendly (webhook).
 *
 * Parcours :
 *   1. Un visiteur reserve un appel decouverte via Calendly.
 *   2. Calendly POST le webhook signe vers /api/webhooks/calendly.
 *   3. Le contact est upserte avec :
 *      - tag generique "rdv-calendly-pris"
 *      - tag source mappe depuis le nom de l'event (ici Instagram -> source:instagram)
 *      - tag closer:antony si l'event est attribue a Antony
 *   4. Un log est ecrit dans contact_events (event_type=calendly_invitee_created).
 *   5. Auto-enroll dans les sequences qui trigent sur les nouveaux tags.
 *
 * Pre-requis : CALENDLY_WEBHOOK_SIGNING_KEY dans .env.local.
 * On calcule la signature HMAC-SHA256 nous-memes pour simuler Calendly.
 */
import crypto from "node:crypto";
import {
  supabase,
  env,
  BASE_URL,
  testEmail,
  title,
  step,
  info,
  pass,
  fail,
  settle,
  getContact,
  expectTags,
  cleanup,
  summary,
  requireDevServer,
} from "./_lib.mjs";

async function signPayload(rawBody, signingKey) {
  const t = Math.floor(Date.now() / 1000);
  const signed = `${t}.${rawBody}`;
  const v1 = crypto.createHmac("sha256", signingKey).update(signed).digest("hex");
  return `t=${t},v1=${v1}`;
}

async function run() {
  title("Scenario 04 : Prise de RDV Calendly (webhook signe)");
  await requireDevServer();

  step("Verification CALENDLY_WEBHOOK_SIGNING_KEY present");
  const key = env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!key) {
    fail("CALENDLY_WEBHOOK_SIGNING_KEY absent de .env.local");
    return summary();
  }
  pass(`signing key trouvee (${key.slice(0, 8)}…)`);

  const email = testEmail("calendly");
  info(`email visiteur : ${email}`);

  // Payload simulant un RDV Instagram avec Antony comme closer
  const payload = {
    event: "invitee.created",
    payload: {
      email,
      first_name: "Léa",
      last_name: "Investisseuse",
      name: "Léa Investisseuse",
      text_reminder_number: "+33612345678",
      scheduled_event: {
        uri: `https://api.calendly.com/scheduled_events/test-${Date.now()}`,
        name: "Appel decouverte (Instagram)",
        start_time: new Date(Date.now() + 86400_000).toISOString(),
        end_time: new Date(Date.now() + 86400_000 + 1800_000).toISOString(),
        event_memberships: [
          { user_email: "antony@emeline-siron.fr", user_name: "Antony" },
        ],
      },
    },
  };

  step("Calendly POST le webhook signe");
  const rawBody = JSON.stringify(payload);
  const signature = await signPayload(rawBody, key);
  const res = await fetch(`${BASE_URL}/api/webhooks/calendly`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Calendly-Webhook-Signature": signature,
    },
    body: rawBody,
  });
  const json = await res.json().catch(() => null);
  if (res.ok) pass(`POST 200 : ${JSON.stringify(json)}`);
  else {
    fail(`POST échoué (${res.status})`, JSON.stringify(json));
    await cleanup(email);
    return summary();
  }
  await settle(400);

  step("Le contact arrive dans le CRM avec les bons tags");
  const contact = await getContact(email);
  if (!contact) {
    fail(`contact absent`);
    return summary();
  }
  pass(`contact trouvé (id ${contact.id.slice(0, 8)}…)`);
  if (contact.first_name === "Léa") pass(`first_name = "Léa"`);
  else fail(`first_name attendu "Léa", actuel "${contact.first_name}"`);
  expectTags(contact, ["rdv-calendly-pris", "source:instagram", "closer:antony"]);

  step("Un log existe dans contact_events");
  const { data: ev } = await supabase
    .from("contact_events")
    .select("event_type, metadata, created_at")
    .eq("contact_id", contact.id)
    .eq("event_type", "calendly_invitee_created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ev) {
    pass(`log calendly_invitee_created présent`);
    if (ev.metadata?.source === "instagram") pass(`metadata.source = "instagram"`);
    else fail(`metadata.source attendu "instagram", actuel "${ev.metadata?.source}"`);
  } else {
    fail(`pas de log contact_events`);
  }

  step("Test rejet : signature invalide doit retourner 401");
  const badRes = await fetch(`${BASE_URL}/api/webhooks/calendly`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Calendly-Webhook-Signature": `t=${Math.floor(Date.now() / 1000)},v1=deadbeef`,
    },
    body: rawBody,
  });
  if (badRes.status === 401) pass(`signature invalide => 401 (securite OK)`);
  else fail(`signature invalide => ${badRes.status} (attendu 401)`);

  step("Cleanup");
  await cleanup(email);
  pass(`contact + events supprimés`);

  return summary();
}

const result = await run();
process.exit(result.failed > 0 ? 1 : 0);
