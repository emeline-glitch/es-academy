import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

/**
 * POST /api/admin/seo/keyword-history
 *
 * Enregistre une mesure de position pour un mot-cle (saisie manuelle depuis
 * Search Console). Update aussi la valeur "current" sur seo_target_keywords
 * pour affichage rapide.
 *
 * Body :
 *   {
 *     keyword_id: uuid,
 *     position: number,            // ex: 3.5 (= position moyenne)
 *     impressions: number,
 *     clicks: number,
 *     period_start?: string (ISO date),
 *     period_end?: string,
 *     notes?: string,
 *   }
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const { keyword_id, position, impressions, clicks, period_start, period_end, notes } = body as {
    keyword_id?: string;
    position?: number;
    impressions?: number;
    clicks?: number;
    period_start?: string;
    period_end?: string;
    notes?: string;
  };

  if (!keyword_id) {
    return NextResponse.json({ error: "keyword_id requis" }, { status: 400 });
  }

  const ctr =
    typeof impressions === "number" && impressions > 0 && typeof clicks === "number"
      ? clicks / impressions
      : null;

  const supabase = await createServiceClient();

  // 1. Insert dans l'historique
  const { error: insErr } = await supabase.from("seo_keyword_history").insert({
    keyword_id,
    position: position ?? null,
    impressions: impressions ?? null,
    clicks: clicks ?? null,
    ctr,
    period_start: period_start || null,
    period_end: period_end || null,
    source: "manual",
    notes: notes || null,
    recorded_by: auth.userId,
  });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // 2. Update la valeur "current" sur seo_target_keywords pour display rapide
  const updates: Record<string, unknown> = {
    last_checked_at: new Date().toISOString(),
  };
  if (position !== undefined) updates.current_position = position;
  if (impressions !== undefined) updates.current_impressions = impressions;
  if (clicks !== undefined) updates.current_clicks = clicks;
  await supabase.from("seo_target_keywords").update(updates).eq("id", keyword_id);

  revalidatePath("/admin/seo");
  return NextResponse.json({ ok: true });
}
