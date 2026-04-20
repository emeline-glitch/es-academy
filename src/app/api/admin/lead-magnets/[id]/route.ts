import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

const VALID_FORMATS = ["masterclass", "quiz", "simulator", "pdf", "email_series", "game"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("lead_magnets")
    .select("*, welcome_sequence:welcome_sequence_id (id, name, status)")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Lead magnet introuvable" }, { status: 404 });
  return NextResponse.json({ lead_magnet: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.description !== undefined) update.description = body.description;
  if (body.format !== undefined) {
    if (!VALID_FORMATS.includes(body.format)) {
      return NextResponse.json({ error: "Format invalide" }, { status: 400 });
    }
    update.format = body.format;
  }
  if (body.is_active !== undefined) update.is_active = !!body.is_active;
  if (body.available_from !== undefined) update.available_from = body.available_from || null;
  if (body.available_until !== undefined) update.available_until = body.available_until || null;
  if (body.welcome_sequence_id !== undefined) update.welcome_sequence_id = body.welcome_sequence_id || null;
  if (body.landing_page_url !== undefined) update.landing_page_url = body.landing_page_url || null;
  if (body.asset_url !== undefined) update.asset_url = body.asset_url || null;
  if (body.cover_image_url !== undefined) update.cover_image_url = body.cover_image_url || null;
  if (body.opt_in_tag !== undefined) update.opt_in_tag = body.opt_in_tag;
  if (body.sort_order !== undefined) update.sort_order = Number(body.sort_order) || 0;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("lead_magnets")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Lead magnet introuvable" }, { status: 404 });

  revalidatePath("/admin/lead-magnets");
  return NextResponse.json({ lead_magnet: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const supabase = await createServiceClient();
  const { error } = await supabase.from("lead_magnets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/admin/lead-magnets");
  return NextResponse.json({ success: true });
}
