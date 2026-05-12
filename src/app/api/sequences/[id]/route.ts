import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { writeAuditLog, extractRequestContext } from "@/lib/utils/audit";

const VALID_STATUSES = ["draft", "active", "paused", "archived"] as const;
const VALID_TRIGGERS = ["tag_added", "form_submit", "manual", "product_purchase"] as const;

// GET : Get a single sequence with steps
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = auth.supabase;

  const { id } = await params;

  const { data, error } = await supabase
    .from("email_sequences")
    .select("*, steps:email_sequence_steps(*)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  data.steps = (data.steps || []).sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order);

  return NextResponse.json(data);
}

// PATCH : Update a sequence
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = auth.supabase;

  const { id } = await params;
  const body = await request.json();

  const { data: before } = await supabase
    .from("email_sequences")
    .select("name, trigger_type, trigger_value, status")
    .eq("id", id)
    .maybeSingle();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.trigger_value !== undefined) updateData.trigger_value = body.trigger_value;
  if (body.trigger_type !== undefined) {
    if (!VALID_TRIGGERS.includes(body.trigger_type)) {
      return NextResponse.json({ error: `trigger_type invalide (attendu: ${VALID_TRIGGERS.join(", ")})` }, { status: 400 });
    }
    updateData.trigger_type = body.trigger_type;
  }
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `status invalide (attendu: ${VALID_STATUSES.join(", ")})` }, { status: 400 });
    }
    updateData.status = body.status;
  }

  const { data, error } = await supabase
    .from("email_sequences")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog(supabase, {
    actor_id: auth.userId,
    actor_email: auth.user.email || null,
    action: "sequence.update",
    entity_type: "email_sequence",
    entity_id: id,
    before: before || null,
    after: {
      name: data.name,
      trigger_type: data.trigger_type,
      trigger_value: data.trigger_value,
      status: data.status,
      request_context: extractRequestContext(request),
    },
  });

  revalidatePath("/admin/sequences");
  revalidatePath(`/admin/sequences/${id}`);
  return NextResponse.json(data);
}

// DELETE : Delete a sequence (cascades to steps and enrollments)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = auth.supabase;

  const { id } = await params;

  const { data: before } = await supabase
    .from("email_sequences")
    .select("name, trigger_type, trigger_value, status")
    .eq("id", id)
    .maybeSingle();

  const { count: enrolledCount } = await supabase
    .from("email_sequence_enrollments")
    .select("*", { count: "exact", head: true })
    .eq("sequence_id", id)
    .eq("status", "active");

  const { error } = await supabase
    .from("email_sequences")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog(supabase, {
    actor_id: auth.userId,
    actor_email: auth.user.email || null,
    action: "sequence.delete",
    entity_type: "email_sequence",
    entity_id: id,
    before: before || null,
    after: {
      active_enrollments_at_delete: enrolledCount ?? 0,
      request_context: extractRequestContext(request),
    },
  });

  revalidatePath("/admin/sequences");
  return NextResponse.json({ success: true });
}
