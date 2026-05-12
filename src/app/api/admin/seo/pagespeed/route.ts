import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auditAllKeyLandings, runPageSpeedAudit, persistPageSpeedResult } from "@/lib/seo/pagespeed";
import { getKeyLandings } from "@/lib/seo/settings";
import { requireAdmin } from "@/lib/utils/admin-auth";

/**
 * POST /api/admin/seo/pagespeed
 *
 * Body :
 *   { mode: "all" }                    -> audit toutes les KEY_LANDINGS (mobile)
 *   { mode: "single", path: "/" }      -> audit une page specifique
 *   { mode: "all", strategy: "desktop" } -> audit desktop
 *
 * Long : 10-30s par page, donc total ~3-5 min pour ~10 pages.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const mode = (body.mode as string) || "all";
  const strategy = (body.strategy as "mobile" | "desktop") || "mobile";

  try {
    if (mode === "single") {
      const path = body.path as string;
      if (!path) return NextResponse.json({ error: "path requis" }, { status: 400 });
      const result = await runPageSpeedAudit(path, strategy);
      await persistPageSpeedResult(result);
      revalidatePath("/admin/seo");
      return NextResponse.json({ result });
    }

    // mode = "all"
    const landings = await getKeyLandings();
    const monitored = landings.filter((l) => l.monitor).map((l) => l.path);
    const out = await auditAllKeyLandings(monitored, strategy);
    revalidatePath("/admin/seo");
    return NextResponse.json({ ok: out.ok, failed: out.failed, total: monitored.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
