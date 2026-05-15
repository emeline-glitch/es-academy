import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/cta/click
 *
 * Track un clic CTA. Appele cote client a chaque fois qu'un utilisateur
 * clique sur un bouton tagge avec data-cta="xxx". L'attribution se fera
 * cote DB en joignant cta_clicks.email avec enrollments par profiles.email.
 *
 * Body attendu :
 *   {
 *     cta_id: string (obligatoire),
 *     page_path: string (obligatoire),
 *     email?: string,
 *     session_id?: string,
 *     utm_source?, utm_medium?, utm_campaign?,
 *     referrer?: string
 *   }
 *
 * Pas d'auth requise : le tracking est public (le buyer n'est pas encore
 * connecte au moment du clic). On limite la pollution via :
 *   - validation stricte des champs (cta_id alphanumerique max 60 chars)
 *   - rate limiting cote middleware si necessaire plus tard
 *   - ignore body trop gros (max 2 KB)
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const cta_id = typeof b.cta_id === "string" ? b.cta_id.trim() : "";
  const page_path = typeof b.page_path === "string" ? b.page_path.trim() : "";

  if (!cta_id || cta_id.length > 60 || !/^[a-z0-9_:.-]+$/i.test(cta_id)) {
    return NextResponse.json({ error: "cta_id invalide" }, { status: 400 });
  }
  if (!page_path || page_path.length > 200) {
    return NextResponse.json({ error: "page_path invalide" }, { status: 400 });
  }

  const email = typeof b.email === "string" && b.email.length < 200 ? b.email.toLowerCase().trim() : null;
  const session_id = typeof b.session_id === "string" && b.session_id.length < 100 ? b.session_id : null;
  const utm_source = typeof b.utm_source === "string" && b.utm_source.length < 100 ? b.utm_source : null;
  const utm_medium = typeof b.utm_medium === "string" && b.utm_medium.length < 100 ? b.utm_medium : null;
  const utm_campaign = typeof b.utm_campaign === "string" && b.utm_campaign.length < 100 ? b.utm_campaign : null;
  const referrer = typeof b.referrer === "string" && b.referrer.length < 500 ? b.referrer : null;
  const user_agent = (request.headers.get("user-agent") || "").slice(0, 500) || null;

  const supabase = await createServiceClient();
  const { error } = await supabase.from("cta_clicks").insert({
    cta_id,
    page_path,
    email,
    session_id,
    utm_source,
    utm_medium,
    utm_campaign,
    user_agent,
    referrer,
  });

  if (error) {
    console.error("[cta-track] insert error:", error.message);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }

  // 204 No Content : client n'attend rien en retour, on minimise la
  // bande passante. fetch() avec keepalive=true va aller jusqu'au bout
  // meme si l'user navigue avant le retour.
  return new NextResponse(null, { status: 204 });
}
