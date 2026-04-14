import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — Get a single sequence with steps
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

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

// PATCH — Update a sequence
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.trigger_type !== undefined) updateData.trigger_type = body.trigger_type;
  if (body.trigger_value !== undefined) updateData.trigger_value = body.trigger_value;
  if (body.status !== undefined) updateData.status = body.status;

  const { data, error } = await supabase
    .from("email_sequences")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — Delete a sequence (cascades to steps and enrollments)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from("email_sequences")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
