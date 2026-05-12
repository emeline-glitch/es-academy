import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

/**
 * GET /api/admin/seo/settings -> retourne tous les settings (key_landings, audit_thresholds, etc.)
 * PATCH /api/admin/seo/settings -> update un setting (body: { key, value })
 */

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("seo_settings")
    .select("key, value, description, updated_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byKey: Record<string, unknown> = {};
  for (const row of data || []) byKey[row.key] = { value: row.value, description: row.description, updated_at: row.updated_at };
  return NextResponse.json({ settings: byKey });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const { key, value } = body as { key?: string; value?: unknown };
  if (!key || value === undefined) {
    return NextResponse.json({ error: "key et value requis" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("seo_settings")
    .upsert({ key, value, updated_by: auth.userId }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/admin/seo");
  return NextResponse.json({ ok: true });
}
