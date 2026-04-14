import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH — Update a step
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { stepId } = await params;
  const body = await request.json();

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
  return NextResponse.json(data);
}

// DELETE — Delete a step
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { stepId } = await params;

  const { error } = await supabase
    .from("email_sequence_steps")
    .delete()
    .eq("id", stepId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
