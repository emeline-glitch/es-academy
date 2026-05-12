import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { writeAuditLog, extractRequestContext } from "@/lib/utils/audit";

// GET : Fetch un step complet (avec html_content) à la demande
// Permet à la liste /admin/sequences de ne charger que les métas, et fetcher le HTML uniquement
// au clic sur "Modifier" → divise par 10 le payload initial de la page.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = auth.supabase;

  const { stepId } = await params;
  const { data, error } = await supabase
    .from("email_sequence_steps")
    .select("id, step_order, delay_days, delay_hours, subject, html_content, status")
    .eq("id", stepId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Step introuvable" }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH : Update a step
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = auth.supabase;

  const { id, stepId } = await params;
  const body = await request.json();

  const { data: before } = await supabase
    .from("email_sequence_steps")
    .select("step_order, delay_days, delay_hours, subject, status")
    .eq("id", stepId)
    .maybeSingle();

  const updateData: Record<string, unknown> = {};
  if (body.delay_days !== undefined) updateData.delay_days = body.delay_days;
  if (body.delay_hours !== undefined) updateData.delay_hours = body.delay_hours;
  if (body.subject !== undefined) updateData.subject = body.subject;
  if (body.html_content !== undefined) updateData.html_content = body.html_content;
  if (body.step_order !== undefined) updateData.step_order = body.step_order;
  if (body.status !== undefined) updateData.status = body.status;

  const { data, error } = await supabase
    .from("email_sequence_steps")
    .update(updateData)
    .eq("id", stepId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog(supabase, {
    actor_id: auth.userId,
    actor_email: auth.user.email || null,
    action: "sequence.step.update",
    entity_type: "email_sequence_step",
    entity_id: stepId,
    before: before || null,
    after: {
      sequence_id: id,
      step_order: data.step_order,
      delay_days: data.delay_days,
      delay_hours: data.delay_hours,
      subject: data.subject,
      status: data.status,
      html_content_changed: body.html_content !== undefined,
      request_context: extractRequestContext(request),
    },
  });

  revalidatePath("/admin/sequences");
  revalidatePath(`/admin/sequences/${id}`);
  return NextResponse.json(data);
}

// DELETE : Delete a step
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = auth.supabase;

  const { id, stepId } = await params;

  const { data: before } = await supabase
    .from("email_sequence_steps")
    .select("step_order, subject, delay_days, delay_hours, status")
    .eq("id", stepId)
    .maybeSingle();

  const { error } = await supabase
    .from("email_sequence_steps")
    .delete()
    .eq("id", stepId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog(supabase, {
    actor_id: auth.userId,
    actor_email: auth.user.email || null,
    action: "sequence.step.delete",
    entity_type: "email_sequence_step",
    entity_id: stepId,
    before: before || null,
    after: {
      sequence_id: id,
      request_context: extractRequestContext(request),
    },
  });

  revalidatePath("/admin/sequences");
  revalidatePath(`/admin/sequences/${id}`);
  return NextResponse.json({ success: true });
}
