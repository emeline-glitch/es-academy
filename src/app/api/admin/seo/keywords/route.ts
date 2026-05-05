import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

interface KeywordPayload {
  id?: string;
  keyword?: string;
  priority?: number;
  target_page?: string | null;
  current_position?: number | null;
  current_impressions?: number | null;
  current_clicks?: number | null;
  notes?: string | null;
}

/**
 * POST /api/admin/seo/keywords -> creer un mot-cle
 * body : { keyword, priority?, target_page?, notes? }
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => ({}))) as KeywordPayload;
  const keyword = body.keyword?.trim().toLowerCase();
  if (!keyword) {
    return NextResponse.json({ error: "keyword requis" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("seo_target_keywords")
    .insert({
      keyword,
      priority: body.priority ?? 2,
      target_page: body.target_page || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Mot-cle deja suivi" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidatePath("/admin/seo");
  return NextResponse.json({ keyword: data });
}

/**
 * PATCH /api/admin/seo/keywords -> mise a jour partielle
 * body : { id, ...fields }
 */
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => ({}))) as KeywordPayload;
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.keyword !== undefined) update.keyword = body.keyword.trim().toLowerCase();
  if (body.priority !== undefined) update.priority = body.priority;
  if (body.target_page !== undefined) update.target_page = body.target_page || null;
  if (body.current_position !== undefined) {
    update.current_position = body.current_position;
    update.last_checked_at = new Date().toISOString();
  }
  if (body.current_impressions !== undefined) update.current_impressions = body.current_impressions;
  if (body.current_clicks !== undefined) update.current_clicks = body.current_clicks;
  if (body.notes !== undefined) update.notes = body.notes || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Aucun champ a mettre a jour" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("seo_target_keywords")
    .update(update)
    .eq("id", body.id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/admin/seo");
  return NextResponse.json({ keyword: data });
}

/**
 * DELETE /api/admin/seo/keywords?id=xxx
 */
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const supabase = await createServiceClient();
  const { error } = await supabase.from("seo_target_keywords").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/admin/seo");
  return NextResponse.json({ ok: true });
}
