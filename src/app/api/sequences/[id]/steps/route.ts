import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { writeAuditLog, extractRequestContext } from "@/lib/utils/audit";

// POST : Add a step to a sequence
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = auth.supabase;

  const { id } = await params;
  const body = await request.json();

  // Get max step_order
  const { data: existing } = await supabase
    .from("email_sequence_steps")
    .select("step_order")
    .eq("sequence_id", id)
    .order("step_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].step_order + 1 : 0;

  const { data, error } = await supabase
    .from("email_sequence_steps")
    .insert({
      sequence_id: id,
      step_order: body.step_order ?? nextOrder,
      delay_days: body.delay_days ?? 0,
      delay_hours: body.delay_hours ?? 0,
      subject: body.subject || "Nouvel email",
      html_content: body.html_content || "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog(supabase, {
    actor_id: auth.userId,
    actor_email: auth.user.email || null,
    action: "sequence.step.create",
    entity_type: "email_sequence_step",
    entity_id: data.id,
    after: {
      sequence_id: id,
      step_order: data.step_order,
      subject: data.subject,
      delay_days: data.delay_days,
      delay_hours: data.delay_hours,
      request_context: extractRequestContext(request),
    },
  });

  revalidatePath("/admin/sequences");
  revalidatePath(`/admin/sequences/${id}`);
  return NextResponse.json(data);
}
