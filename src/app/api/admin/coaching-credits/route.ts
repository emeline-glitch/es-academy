import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié", status: 401 as const, supabase: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: "Accès réservé aux admins", status: 403 as const, supabase: null };
  }
  return { error: null, status: 200 as const, supabase };
}

export async function PATCH(request: Request) {
  const { error: authError, status, supabase } = await requireAdmin();
  if (authError || !supabase) {
    return NextResponse.json({ error: authError }, { status });
  }

  const body = await request.json().catch(() => ({}));
  const { user_id, credits_total, credits_used } = body as {
    user_id?: string;
    credits_total?: number;
    credits_used?: number;
  };

  if (!user_id) {
    return NextResponse.json({ error: "user_id requis" }, { status: 400 });
  }

  const update: Record<string, number> = {};
  if (typeof credits_total === "number" && credits_total >= 0) {
    update.coaching_credits_total = Math.floor(credits_total);
  }
  if (typeof credits_used === "number" && credits_used >= 0) {
    update.coaching_credits_used = Math.floor(credits_used);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Aucun champ valide à mettre à jour" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user_id)
    .select("id, coaching_credits_total, coaching_credits_used")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
