import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateBody } from "@/lib/validators/validate";
import { TrackPageViewSchema } from "@/lib/validators/tracking";

const BOT_REGEX = /(bot|crawler|spider|crawling|wget|curl|python-requests|axios|node-fetch|googlebot|bingbot|ahrefs|semrush|yandex|baiduspider|applebot|mj12|dotbot|screaming|petalbot|facebookexternalhit|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|headlesschrome|phantom|puppeteer|playwright|lighthouse)/i;

const SKIP_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/cours",
  "/api",
  "/connexion",
  "/inscription",
  "/site-password",
  "/_next",
];

export async function POST(request: Request) {
  const v = await validateBody(request, TrackPageViewSchema);
  if (!v.ok) return v.response;
  const body = v.data;
  const path = body.path;
  const rawReferrer = body.referrer ?? null;
  const sessionId = body.session_id ?? null;

  if (SKIP_PATH_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.json({ skipped: true });
  }

  const userAgent = request.headers.get("user-agent") || "";
  const isBot = BOT_REGEX.test(userAgent);

  // Pas de log brut de l'IP (RGPD), on garde juste country via header CDN si dispo.
  const country =
    request.headers.get("x-nf-geo")?.split(",")[0] ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-vercel-ip-country") ||
    null;

  // Normaliser le referrer : on rejette les referrers internes (notre propre site)
  // sauf le premier hit (Direct).
  let referrer: string | null = rawReferrer && rawReferrer.length <= 500 ? rawReferrer : null;
  if (referrer) {
    try {
      const u = new URL(referrer);
      if (u.hostname === "emeline-siron.fr" || u.hostname === "www.emeline-siron.fr" || u.hostname === "localhost") {
        referrer = null;
      }
    } catch {
      referrer = null;
    }
  }

  try {
    const supabase = await createServiceClient();
    await supabase.from("seo_page_views").insert({
      path,
      referrer,
      user_agent: userAgent.slice(0, 500),
      country,
      is_bot: isBot,
      session_id: sessionId?.slice(0, 100) || null,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      utm_term: body.utm_term ?? null,
      utm_content: body.utm_content ?? null,
      gclid: body.gclid ?? null,
      fbclid: body.fbclid ?? null,
      landing_path: body.landing_path ?? null,
    });
  } catch (e) {
    console.error("[track/page-view] insert error:", e);
    // Pas de 500 visible cote client, le tracking ne doit jamais bloquer la page.
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
