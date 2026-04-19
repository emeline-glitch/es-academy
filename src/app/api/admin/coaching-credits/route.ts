import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const supabase = await createServiceClient();

  const body = await request.json().catch(() => ({}));
  const { user_id, credits_total, credits_used } = body as {
    user_id?: string;
    credits_total?: number;
    credits_used?: number;
  };

  if (!user_id) {
    return NextResponse.json({ error: "user_id requis" }, { status: 400 });
  }

  // Vérifier la cohérence used ≤ total (sinon on affiche du "reste -3 coachings" absurde)
  // On charge d'abord les valeurs actuelles pour valider contre les champs non modifiés
  const { data: current } = await supabase
    .from("profiles")
    .select("coaching_credits_total, coaching_credits_used")
    .eq("id", user_id)
    .maybeSingle();

  const nextTotal = typeof credits_total === "number" && credits_total >= 0
    ? Math.floor(credits_total)
    : (current?.coaching_credits_total ?? 0);
  const nextUsed = typeof credits_used === "number" && credits_used >= 0
    ? Math.floor(credits_used)
    : (current?.coaching_credits_used ?? 0);

  if (nextUsed > nextTotal) {
    return NextResponse.json(
      {
        error: `Incohérence : ${nextUsed} coachings utilisés > ${nextTotal} total. Augmente le total ou réduis les utilisés.`,
      },
      { status: 400 }
    );
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

  revalidatePath("/admin/eleves");
  revalidatePath(`/admin/eleves/${user_id}`);

  return NextResponse.json({ profile: data });
}
