import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { autoEnrollByTags } from "@/lib/sequences/auto-enroll";
import { verifyCalendlySignature } from "@/lib/utils/calendly-signature";

/**
 * Webhook Calendly v2 : reception des events `invitee.created` (RDV pris)
 * et `invitee.canceled` (RDV annule).
 *
 * Flow invitee.created :
 * 1. Verification HMAC sur header Calendly-Webhook-Signature
 * 2. Mapping du nom de l'event Calendly vers un tag source (`source:podcast`, etc.)
 * 3. Upsert atomique du contact via RPC (merge tags, preserve unsubscribed)
 * 4. Log dans contact_events (event_type: "calendly_invitee_created")
 * 5. Auto-enroll sur les nouvelles sequences declenchees par tag
 *
 * Tag generique `rdv-calendly-pris` ajoute a tous les RDV (utile pour dashboard Antony).
 * Tag specifique `source:xxx` ajoute seulement si on a su mapper le nom.
 */

interface CalendlyInviteePayload {
  event?: string;
  payload?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    text_reminder_number?: string;
    questions_and_answers?: Array<{ question?: string; answer?: string }>;
    scheduled_event?: {
      uri?: string;
      name?: string;
      start_time?: string;
      end_time?: string;
      event_memberships?: Array<{
        user_email?: string;
        user_name?: string;
        user?: string;
      }>;
    };
    tracking?: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    };
  };
}

const ANTONY_EMAIL = "antony"; // match partiel sur l'email de l'hote Calendly
const EMELINE_EMAIL = "emeline";

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Mapping nom de l'event Calendly vers tag source.
 * Les 6 events de tracking sont nommes "On parle de ton projet immo (Newsletter)" etc.
 * Si on ajoute un nouveau canal, etendre ce mapping.
 */
function eventNameToSourceTag(eventName: string): string | null {
  const n = normalize(eventName);
  if (n.includes("newsletter")) return "source:newsletter";
  if (n.includes("podcast")) return "source:podcast";
  if (n.includes("linkedin")) return "source:linkedin";
  if (n.includes("instagram")) return "source:instagram";
  if (n.includes("cahier")) return "source:cahier-vacances";
  if (n.includes("site")) return "source:site";
  if (n.includes("academy")) return "source:academy-post-achat";
  return null;
}

function eventNameToContextTag(eventName: string): string | null {
  const n = normalize(eventName);
  if (n.includes("coaching") && n.includes("package")) return "coaching:package";
  if (n.includes("coaching") && n.includes("300")) return "coaching:300";
  if (n.includes("coaching") && n.includes("150")) return "coaching:150";
  if (n.includes("coaching") && n.includes("eleve")) return "coaching:eleve";
  if (n.includes("coaching") && n.includes("session")) return "coaching:session";
  if (n.includes("coaching")) return "coaching:autre";
  if (n.includes("decouverte")) return "appel-decouverte";
  return null;
}

function hostTag(hostEmail: string | undefined): string | null {
  if (!hostEmail) return null;
  const h = normalize(hostEmail);
  if (h.includes(ANTONY_EMAIL)) return "closer:antony";
  if (h.includes(EMELINE_EMAIL)) return "host:emeline";
  return null;
}

export async function POST(request: Request) {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!signingKey) {
    console.error("[calendly] CALENDLY_WEBHOOK_SIGNING_KEY manquant");
    return NextResponse.json({ error: "Webhook non configure" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("calendly-webhook-signature");
  const verification = verifyCalendlySignature(rawBody, signatureHeader, signingKey);
  if (!verification.valid) {
    console.warn("[calendly] signature invalide:", verification.reason);
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let body: CalendlyInviteePayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Payload JSON invalide" }, { status: 400 });
  }

  const eventType = body.event || "";
  if (eventType !== "invitee.created" && eventType !== "invitee.canceled") {
    return NextResponse.json({ status: "ignored", reason: `event ${eventType} non gere` });
  }

  const invitee = body.payload || {};
  const email = (invitee.email || "").toLowerCase().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.warn("[calendly] email absent ou invalide:", email);
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const firstName =
    invitee.first_name || invitee.name?.split(" ")[0] || "";
  const lastName =
    invitee.last_name || invitee.name?.split(" ").slice(1).join(" ") || "";
  const phone = invitee.text_reminder_number || null;

  const scheduled = invitee.scheduled_event || {};
  const eventName = scheduled.name || "";
  const hostEmail = scheduled.event_memberships?.[0]?.user_email;

  const supabase = await createServiceClient();

  if (eventType === "invitee.canceled") {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from("contact_events").insert({
        contact_id: existing.id,
        event_type: "calendly_invitee_canceled",
        metadata: {
          event_name: eventName,
          event_uri: scheduled.uri,
          start_time: scheduled.start_time,
          host_email: hostEmail,
        },
      });
    }
    return NextResponse.json({ success: true, action: "canceled_logged" });
  }

  const sourceTag = eventNameToSourceTag(eventName);
  const contextTag = eventNameToContextTag(eventName);
  const host = hostTag(hostEmail);

  const tagsToApply: string[] = ["rdv-calendly-pris"];
  if (sourceTag) tagsToApply.push(sourceTag);
  if (contextTag) tagsToApply.push(contextTag);
  if (host) tagsToApply.push(host);

  const sourceField =
    sourceTag?.replace("source:", "") ||
    contextTag?.split(":")[0] ||
    "calendly";

  const { data: rpcResult, error: upsertErr } = await supabase.rpc(
    "upsert_contact_with_tags",
    {
      p_email: email,
      p_first_name: firstName,
      p_last_name: lastName,
      p_add_tags: tagsToApply,
      p_source: sourceField,
    },
  );

  if (upsertErr || !rpcResult || rpcResult.length === 0) {
    console.error("[calendly] upsert RPC error:", upsertErr);
    return NextResponse.json({ error: "Erreur upsert contact" }, { status: 500 });
  }

  const contactId = rpcResult[0].id as string;
  const previousTags = (rpcResult[0].previous_tags || []) as string[];

  if (phone) {
    await supabase.from("contacts").update({ phone }).eq("id", contactId);
  }

  await supabase.from("contact_events").insert({
    contact_id: contactId,
    event_type: "calendly_invitee_created",
    metadata: {
      event_name: eventName,
      event_uri: scheduled.uri,
      start_time: scheduled.start_time,
      end_time: scheduled.end_time,
      host_email: hostEmail,
      source: sourceTag?.replace("source:", "") || null,
      context: contextTag || null,
      utm_source: invitee.tracking?.utm_source || null,
      utm_medium: invitee.tracking?.utm_medium || null,
      utm_campaign: invitee.tracking?.utm_campaign || null,
    },
  });

  const newlyAdded = tagsToApply.filter((t) => !previousTags.includes(t));
  if (newlyAdded.length > 0) {
    await autoEnrollByTags(supabase, contactId, newlyAdded);
  }

  return NextResponse.json({
    success: true,
    contact_id: contactId,
    tags_added: newlyAdded,
    source: sourceTag?.replace("source:", "") || null,
  });
}

export async function GET() {
  return NextResponse.json({ status: "webhook ready", endpoint: "calendly" });
}
