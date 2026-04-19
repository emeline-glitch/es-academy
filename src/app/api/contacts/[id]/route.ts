import { NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";

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

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401 as const, error: "Non authentifié" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { ok: false, status: 403 as const, error: "Accès réservé aux admins" };
  return { ok: true };
}

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

  // On tente de retrouver le profil élève correspondant via l'email
  let profile = null;
  let enrollments: unknown[] = [];
  if (data.email) {
    const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const matched = authUsers?.users?.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (matched) {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, role, coaching_credits_total, coaching_credits_used")
        .eq("id", matched.id)
        .maybeSingle();
      profile = p;

      const { data: enr } = await supabase
        .from("enrollments")
        .select("id, product_name, amount_paid, purchased_at, status")
        .eq("user_id", matched.id)
        .order("purchased_at", { ascending: false });
      enrollments = enr || [];
    }
  }

  return NextResponse.json({ contact: data, profile, enrollments });
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

  const updateData: Record<string, unknown> = {};
  if (body.tags) updateData.tags = body.tags;
  if (body.status) updateData.status = body.status;
  if (body.first_name !== undefined) updateData.first_name = body.first_name;
  if (body.last_name !== undefined) updateData.last_name = body.last_name;
  if (body.source) updateData.source = body.source;
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
  return NextResponse.json({ contact: data });
}
