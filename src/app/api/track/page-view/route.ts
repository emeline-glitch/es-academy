import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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

interface TrackPayload {
  path?: unknown;
  referrer?: unknown;
  session_id?: unknown;
}

export async function POST(request: Request) {
  let body: TrackPayload;
  try {
    body = (await request.json()) as TrackPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path : null;
  const rawReferrer = typeof body.referrer === "string" ? body.referrer : null;
  const sessionId = typeof body.session_id === "string" ? body.session_id : null;

  if (!path || path.length > 500) {
    return NextResponse.json({ error: "Bad path" }, { status: 400 });
  }
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
    });
  } catch (e) {
    console.error("[track/page-view] insert error:", e);
    // Pas de 500 visible cote client, le tracking ne doit jamais bloquer la page.
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
