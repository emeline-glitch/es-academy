import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { writeAuditLog, extractRequestContext } from "@/lib/utils/audit";

// POST : Enroll contacts in a sequence
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = auth.supabase;

  const { id } = await params;
  const body = await request.json();
  const { contact_ids, tag } = body;

  // Get sequence with first step
  const { data: sequence } = await supabase
    .from("email_sequences")
    .select("*, steps:email_sequence_steps(*)")
    .eq("id", id)
    .single();

  if (!sequence) return NextResponse.json({ error: "Séquence introuvable" }, { status: 404 });

  const steps = (sequence.steps || []).sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order);
  if (steps.length === 0) return NextResponse.json({ error: "Séquence sans étapes" }, { status: 400 });

  const firstStep = steps[0];
  const delayMs = (firstStep.delay_days * 24 * 60 + firstStep.delay_hours * 60) * 60 * 1000;
  const nextSendAt = new Date(Date.now() + delayMs).toISOString();

  // Get contacts to enroll
  let ids: string[] = contact_ids || [];

  // If tag is provided, fetch contacts with that tag
  if (tag && ids.length === 0) {
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id")
      .eq("status", "active")
      .contains("tags", [tag]);
    ids = (contacts || []).map((c) => c.id);
  }

  if (ids.length === 0) return NextResponse.json({ error: "Aucun contact à inscrire" }, { status: 400 });

  let enrolled = 0;
  let skipped = 0;

  for (const contactId of ids) {
    const { error } = await supabase
      .from("email_sequence_enrollments")
      .upsert(
        {
          sequence_id: id,
          contact_id: contactId,
          current_step: 0,
          status: "active",
          next_send_at: nextSendAt,
        },
        { onConflict: "sequence_id,contact_id", ignoreDuplicates: true }
      );

    if (error) skipped++;
    else enrolled++;
  }

  await writeAuditLog(supabase, {
    actor_id: auth.userId,
    actor_email: auth.user.email || null,
    action: "sequence.enroll",
    entity_type: "email_sequence",
    entity_id: id,
    after: {
      sequence_name: sequence.name,
      contacts_targeted: ids.length,
      enrolled,
      skipped,
      via_tag: tag || null,
      via_explicit_ids: Array.isArray(contact_ids) && contact_ids.length > 0,
      request_context: extractRequestContext(request),
    },
  });

  return NextResponse.json({ enrolled, skipped, total: ids.length });
}
