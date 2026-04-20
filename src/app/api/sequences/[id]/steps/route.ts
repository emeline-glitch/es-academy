import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// POST — Add a step to a sequence
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

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
  revalidatePath("/admin/sequences");
  revalidatePath(`/admin/sequences/${id}`);
  return NextResponse.json(data);
}
