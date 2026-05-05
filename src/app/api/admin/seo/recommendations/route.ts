import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

const ALLOWED_STATUS = new Set(["open", "done", "dismissed"]);

/**
 * PATCH /api/admin/seo/recommendations
 * body : { id: string, status: "open" | "done" | "dismissed" }
 *
 * Pas de route dynamique [id] car on a besoin d'un seul handler simple.
 */
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const { id, status } = body as { id?: string; status?: string };

  if (!id || !status || !ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ error: "id et status requis (open|done|dismissed)" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const update: Record<string, unknown> = { status };
  if (status === "done") {
    update.done_at = new Date().toISOString();
    update.done_by = auth.userId;
  } else {
    update.done_at = null;
    update.done_by = null;
  }

  const { data, error } = await supabase
    .from("seo_recommendations")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/admin/seo");
  return NextResponse.json({ recommendation: data });
}
