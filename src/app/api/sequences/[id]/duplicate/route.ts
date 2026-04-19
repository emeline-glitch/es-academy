import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const supabase = await createServiceClient();

  // 1. Charger la séquence source
  const { data: src, error: srcErr } = await supabase
    .from("email_sequences")
    .select("*, steps:email_sequence_steps(step_order, delay_days, delay_hours, subject, html_content, status)")
    .eq("id", id)
    .maybeSingle();

  if (srcErr || !src) return NextResponse.json({ error: "Séquence introuvable" }, { status: 404 });

  // 2. Créer la copie (draft)
  const { data: created, error: cErr } = await supabase
    .from("email_sequences")
    .insert({
      name: `${src.name} (copie)`,
      trigger_type: src.trigger_type,
      trigger_value: src.trigger_value,
      status: "draft",
    })
    .select()
    .single();

  if (cErr || !created) return NextResponse.json({ error: cErr?.message || "Erreur création" }, { status: 500 });

  // 3. Dupliquer les steps
  const steps = (src.steps || []) as Array<{
    step_order: number;
    delay_days: number;
    delay_hours: number;
    subject: string;
    html_content: string;
    status: string;
  }>;
  if (steps.length > 0) {
    const stepsToInsert = steps.map((s) => ({
      sequence_id: created.id,
      step_order: s.step_order,
      delay_days: s.delay_days,
      delay_hours: s.delay_hours,
      subject: s.subject,
      html_content: s.html_content,
      status: s.status || "active",
    }));
    await supabase.from("email_sequence_steps").insert(stepsToInsert);
  }

  return NextResponse.json({ sequence: created, steps_copied: steps.length });
}
