import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { writeAuditLog } from "@/lib/utils/audit";
import { autoEnrollByTags, tagsAdded } from "@/lib/sequences/auto-enroll";

const VALID_STAGES = [
  "leads",
  "prospect",
  "rdv_pris",
  "rdv_effectif",
  "rdv_non_effectif",
  "offre_envoyee",
  "non_qualifie",
  "gagne",
  "perdu",
] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });

  // Lookup profil via profiles.email (indexé, scalable) — avec fallback listUsers si colonne pas encore présente
  let profile: unknown = null;
  let enrollments: unknown[] = [];
  if (data.email) {
    const emailLower = data.email.toLowerCase();
    const { data: p, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, role, coaching_credits_total, coaching_credits_used, email")
      .ilike("email", emailLower)
      .maybeSingle();

    // Si la colonne email n'existe pas encore (avant migration 005), fallback sur listUsers
    if (pErr && /column.*email/i.test(pErr.message)) {
      const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const matched = authUsers?.users?.find((u) => u.email?.toLowerCase() === emailLower);
      if (matched) {
        const { data: p2 } = await supabase
          .from("profiles")
          .select("id, full_name, role, coaching_credits_total, coaching_credits_used")
          .eq("id", matched.id)
          .maybeSingle();
        profile = p2;
      }
    } else if (p) {
      profile = p;
    }

    const profileId = (profile as { id?: string } | null)?.id;
    if (profileId) {
      const { data: enr } = await supabase
        .from("enrollments")
        .select("id, product_name, amount_paid, purchased_at, status")
        .eq("user_id", profileId)
        .order("purchased_at", { ascending: false });
      enrollments = enr || [];
    }
  }

  // Notes — inclus directement dans la réponse (évite un 2e round-trip)
  const { data: notes } = await supabase
    .from("contact_notes")
    .select("id, content, kind, created_at, author_id")
    .eq("contact_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ contact: data, profile, enrollments, notes: notes || [] });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createServiceClient();
  const { id } = await params;
  const body = await request.json();

  // Valeur avant changement (pour audit)
  const { data: before } = await supabase
    .from("contacts")
    .select("pipeline_stage, tags, status")
    .eq("id", id)
    .maybeSingle();

  const updateData: Record<string, unknown> = {};
  if (body.tags) updateData.tags = body.tags;
  if (body.status) updateData.status = body.status;
  if (body.first_name !== undefined) updateData.first_name = body.first_name;
  if (body.last_name !== undefined) updateData.last_name = body.last_name;
  if (body.source) updateData.source = body.source;
  if (body.phone !== undefined) updateData.phone = body.phone ? String(body.phone).trim() : null;
  if (body.pipeline_stage !== undefined) {
    if (!VALID_STAGES.includes(body.pipeline_stage)) {
      return NextResponse.json({ error: "Stage invalide" }, { status: 400 });
    }
    updateData.pipeline_stage = body.pipeline_stage;
    updateData.pipeline_updated_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(updateData)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log pour les changements de stage
  if (body.pipeline_stage !== undefined && before?.pipeline_stage !== body.pipeline_stage) {
    await writeAuditLog(supabase, {
      actor_id: auth.userId,
      action: "pipeline_stage_change",
      entity_type: "contact",
      entity_id: id,
      before: { pipeline_stage: before?.pipeline_stage },
      after: { pipeline_stage: body.pipeline_stage },
    });
    revalidatePath("/admin/dashboard");
  }

  // Auto-enrollment : si de nouveaux tags ont été ajoutés, enroll dans les séquences
  // actives dont le trigger_value correspond à l'un de ces tags.
  if (body.tags && Array.isArray(body.tags)) {
    const added = tagsAdded(before?.tags, body.tags);
    if (added.length > 0) {
      await autoEnrollByTags(supabase, id, added);
    }
  }

  return NextResponse.json({ contact: data });
}
