import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("forms")
    .select("*, list:list_id (id, name, tag_key)")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Formulaire introuvable" }, { status: 404 });
  return NextResponse.json({ form: data });
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
  if (body.title !== undefined) update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (body.list_id !== undefined) update.list_id = body.list_id || null;
  if (body.success_message !== undefined) update.success_message = body.success_message;
  if (body.redirect_url !== undefined) update.redirect_url = body.redirect_url || null;
  if (body.background_image_url !== undefined) update.background_image_url = body.background_image_url || null;
  if (body.require_phone !== undefined) update.require_phone = !!body.require_phone;
  if (body.require_last_name !== undefined) update.require_last_name = !!body.require_last_name;
  if (body.status !== undefined) {
    if (!["draft", "published", "archived"].includes(body.status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body.slug !== undefined) update.slug = slugify(String(body.slug)) || null;

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("forms")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ce slug est déjà utilisé" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${id}`);
  return NextResponse.json({ form: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const supabase = await createServiceClient();
  const { error } = await supabase.from("forms").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/admin/forms");
  return NextResponse.json({ success: true });
}
