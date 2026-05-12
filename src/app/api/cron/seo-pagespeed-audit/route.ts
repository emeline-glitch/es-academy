import { NextResponse } from "next/server";
import { auditAllKeyLandings } from "@/lib/seo/pagespeed";
import { getKeyLandings } from "@/lib/seo/settings";

/**
 * Cron hebdomadaire : audit PageSpeed Insights sur toutes les KEY_LANDINGS.
 *
 * Recommande : lundi 6h UTC. PageSpeed sequentiel, ~10 pages x 2 strategies
 * (mobile + desktop) x 20s/page = ~7 min total.
 *
 * Bearer ${CRON_SECRET}.
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
    const landings = await getKeyLandings();
    const monitored = landings.filter((l) => l.monitor).map((l) => l.path);
    const mobile = await auditAllKeyLandings(monitored, "mobile");
    const desktop = await auditAllKeyLandings(monitored, "desktop");
    return NextResponse.json({
      total: monitored.length,
      mobile: { ok: mobile.ok, failed: mobile.failed },
      desktop: { ok: desktop.ok, failed: desktop.failed },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
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
