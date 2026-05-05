import { NextResponse } from "next/server";
import { runSeoAudit } from "@/lib/seo/audit";

/**
 * Cron /api/cron/seo-audit (hebdomadaire conseille, ex: lundi 5h UTC) :
 *
 * Regenere l'audit SEO complet :
 *   - Scanne articles Notion + pages cles
 *   - Genere les recommandations actionnables
 *   - Purge les recos "open" obsoletes, garde les "done" et "dismissed"
 *
 * Auth : Bearer ${CRON_SECRET} (meme pattern que les autres crons).
 */
export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "CRON_SECRET non configure" }, { status: 500 });
  }
  const auth = request.headers.get("authorization") || "";
  if (auth.replace(/^Bearer\s+/, "") !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSeoAudit();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    console.error("[cron/seo-audit] failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  if (expectedSecret && auth.replace(/^Bearer\s+/, "") !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ status: "ready" });
}
