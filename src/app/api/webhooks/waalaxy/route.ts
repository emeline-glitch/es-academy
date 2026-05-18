import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { autoEnrollByTags } from "@/lib/sequences/auto-enroll";

export const dynamic = "force-dynamic";

/**
 * Webhook Waalaxy (plan Business uniquement, sinon utiliser l'import CSV).
 *
 * Config cote Waalaxy :
 *   Reglages > Integrations > Webhooks > Ajouter
 *   - URL : https://emeline-siron.fr/api/webhooks/waalaxy
 *   - Method : POST
 *   - Header : X-Waalaxy-Secret = <WAALAXY_WEBHOOK_SECRET>
 *   - Events : prospect_email_found (et/ou prospect_created si on veut
 *     enregistrer meme sans email)
 *
 * Waalaxy n'expose pas de signature HMAC officielle a la date d'ecriture,
 * on protege l'endpoint par un secret partage dans un header custom.
 * A defaut on rejette en 401 et on log l'IP source pour audit.
 *
 * Payload type Waalaxy (varie selon event) :
 *   {
 *     "type": "prospect_email_found",
 *     "data": {
 *       "prospect": {
 *         "email": "anais@example.com",
 *         "first_name": "Anais",
 *         "last_name": "Dubois",
 *         "linkedin_url": "https://linkedin.com/in/anais-dubois",
 *         "company": "...",
 *         "headline": "..."
 *       },
 *       "campaign": { "id": "...", "name": "..." }
 *     }
 *   }
 *
 * On extrait l'email, on upsert via la RPC standard, on tag :
 *   - source:linkedin-waalaxy (generique, attribution dashboard)
 *   - linkedin (raccourci segmentation)
 * Et on attache au contact le linkedin_url + headline dans metadata.
 */
export async function POST(request: Request) {
  const expectedSecret = process.env.WAALAXY_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("[waalaxy] WAALAXY_WEBHOOK_SECRET non configure");
    return NextResponse.json({ error: "Webhook non configure" }, { status: 500 });
  }

  // Waalaxy laisse le client choisir le nom du header de secret. On accepte
  // 2 conventions : "X-Waalaxy-Secret" (nom explicite) ou Bearer Authorization.
  const headerSecret =
    request.headers.get("x-waalaxy-secret") ||
    (request.headers.get("authorization") || "").replace(/^Bearer\s+/, "");

  if (headerSecret !== expectedSecret) {
    // Log l'IP pour audit (en cas d'attaque par scan)
    const ip = request.headers.get("x-forwarded-for") || "?";
    console.warn(`[waalaxy] auth invalide depuis ${ip}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON invalide" }, { status: 400 });
  }

  // Extraction tolerante : Waalaxy peut envoyer plusieurs shapes selon
  // l'event et la version. On cherche l'email partout ou il peut etre.
  const prospect =
    (body.data as { prospect?: Record<string, unknown> })?.prospect ||
    (body.prospect as Record<string, unknown>) ||
    (body as Record<string, unknown>);

  const email = String(prospect.email || "").toLowerCase().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // Waalaxy envoie aussi des events sans email (prospect_visited, etc.).
    // On accepte (200) pour ne pas faire retry inutilement mais on ne fait rien.
    return NextResponse.json({ status: "ignored", reason: "no_email" });
  }

  const firstName = String(prospect.first_name || prospect.firstName || "").trim();
  const lastName = String(prospect.last_name || prospect.lastName || "").trim();
  const linkedinUrl = String(prospect.linkedin_url || prospect.linkedinUrl || "").trim();
  const company = String(prospect.company || "").trim();
  const headline = String(prospect.headline || "").trim();
  const campaignName = String(
    (body.data as { campaign?: { name?: string } })?.campaign?.name ||
      (body.campaign as { name?: string })?.name ||
      "",
  ).trim();

  const supabase = await createServiceClient();

  // Upsert contact via la RPC standard (merge tags, preserve unsubscribed,
  // immutable source via primary_source).
  const tags = [
    "source:linkedin-waalaxy",
    "linkedin",
    ...(campaignName ? [`waalaxy:${slugify(campaignName)}`] : []),
  ];

  const { data: rpcRes, error: rpcErr } = await supabase.rpc("upsert_contact_with_tags", {
    p_email: email,
    p_first_name: firstName,
    p_last_name: lastName,
    p_add_tags: tags,
    p_source: "linkedin-waalaxy",
  });

  if (rpcErr) {
    console.error("[waalaxy] upsert RPC failed:", rpcErr.message);
    return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
  }

  const contactId = (rpcRes as Array<{ id: string }>)?.[0]?.id;
  const previousTags = (rpcRes as Array<{ previous_tags: string[] }>)?.[0]?.previous_tags || [];

  // Met a jour les metadata LinkedIn-specifiques si presentes
  if (contactId && (linkedinUrl || company || headline)) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("metadata")
      .eq("id", contactId)
      .maybeSingle();
    const mergedMetadata = {
      ...(existing?.metadata || {}),
      ...(linkedinUrl ? { linkedin_url: linkedinUrl } : {}),
      ...(company ? { linkedin_company: company } : {}),
      ...(headline ? { linkedin_headline: headline } : {}),
      ...(campaignName ? { waalaxy_campaign: campaignName } : {}),
      waalaxy_synced_at: new Date().toISOString(),
    };
    await supabase.from("contacts").update({ metadata: mergedMetadata }).eq("id", contactId);
  }

  // Auto-enroll dans les sequences qui trigent sur les nouveaux tags
  const newlyAdded = tags.filter((t) => !previousTags.includes(t));
  if (contactId && newlyAdded.length > 0) {
    await autoEnrollByTags(supabase, contactId, newlyAdded);
  }

  return NextResponse.json({
    success: true,
    contact_id: contactId,
    tags_added: newlyAdded,
  });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
