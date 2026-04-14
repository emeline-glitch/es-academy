import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — List all sequences with their steps
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: sequences, error } = await supabase
    .from("email_sequences")
    .select("*, steps:email_sequence_steps(*, id, step_order, delay_days, delay_hours, subject, html_content, status)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort steps by step_order
  const sorted = (sequences || []).map((seq) => ({
    ...seq,
    steps: (seq.steps || []).sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order),
  }));

  // Get enrollment counts
  for (const seq of sorted) {
    const { count } = await supabase
      .from("email_sequence_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("sequence_id", seq.id);
    seq.enrolled_count = count || 0;

    const { count: activeCount } = await supabase
      .from("email_sequence_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("sequence_id", seq.id)
      .eq("status", "active");
    seq.active_count = activeCount || 0;
  }

  return NextResponse.json(sorted);
}

// POST — Create a new sequence
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { name, trigger_type, trigger_value } = body;

  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const { data, error } = await supabase
    .from("email_sequences")
    .insert({ name, trigger_type: trigger_type || "signup", trigger_value: trigger_value || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
