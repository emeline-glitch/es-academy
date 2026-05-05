import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_TRIGGERS = ["tag_added", "form_submit", "manual", "product_purchase"] as const;
type TriggerType = (typeof VALID_TRIGGERS)[number];

// GET : List all sequences with their steps + enrollment counts (1 seul RPC pour les compteurs)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // PERF : on NE charge PLUS html_content dans la liste (peut faire 100+ Ko de JSON total avec 64 mails).
  // Le html_content est chargé à la demande quand l'utilisatrice clique sur "Modifier" un step
  // (via GET /api/sequences/[id]/steps/[stepId] ou le payload d'édition).
  const [sequencesRes, countsRes] = await Promise.all([
    supabase
      .from("email_sequences")
      .select("*, steps:email_sequence_steps(id, step_order, delay_days, delay_hours, subject, status)")
      .order("created_at", { ascending: false }),
    supabase.rpc("sequences_with_counts"),
  ]);

  if (sequencesRes.error) return NextResponse.json({ error: sequencesRes.error.message }, { status: 500 });

  const countsMap = new Map<string, { total: number; active: number }>();
  if (!countsRes.error && countsRes.data) {
    for (const row of countsRes.data as Array<{ sequence_id: string; total_enrollments: number; active_enrollments: number }>) {
      countsMap.set(row.sequence_id, {
        total: Number(row.total_enrollments) || 0,
        active: Number(row.active_enrollments) || 0,
      });
    }
  }

  const sorted = (sequencesRes.data || []).map((seq) => {
    const counts = countsMap.get(seq.id) || { total: 0, active: 0 };
    return {
      ...seq,
      steps: (seq.steps || []).sort(
        (a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order
      ),
      enrolled_count: counts.total,
      active_count: counts.active,
    };
  });

  return NextResponse.json(sorted);
}

// POST : Create a new sequence
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { name, trigger_type, trigger_value } = body;

  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const finalTrigger: TriggerType = VALID_TRIGGERS.includes(trigger_type)
    ? trigger_type
    : "manual";

  const { data, error } = await supabase
    .from("email_sequences")
    .insert({
      name,
      trigger_type: finalTrigger,
      trigger_value: trigger_value || null,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/admin/sequences");
  return NextResponse.json(data);
}
