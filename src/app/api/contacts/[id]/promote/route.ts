import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const {
    product_name = "academy",
    amount_paid = 0,
    coaching_credits = 0,
    send_invite = true,
  } = body as {
    product_name?: string;
    amount_paid?: number;
    coaching_credits?: number;
    send_invite?: boolean;
  };

  const supabase = await createServiceClient();

  // 1. Charger le contact
  const { data: contact, error: cErr } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (cErr || !contact) {
    return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });
  }

  // 2. Trouver ou créer l'utilisateur auth
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  let authUser = list?.users?.find((u) => u.email?.toLowerCase() === contact.email.toLowerCase());

  if (!authUser) {
    if (send_invite) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr";
      const { data: invited, error: iErr } = await supabase.auth.admin.inviteUserByEmail(contact.email, {
        redirectTo: `${siteUrl}/connexion`,
        data: {
          full_name: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email,
        },
      });
      if (iErr || !invited?.user) {
        return NextResponse.json({ error: iErr?.message || "Échec invitation" }, { status: 500 });
      }
      authUser = invited.user;
    } else {
      // Création silencieuse (pas d'email envoyé)
      const { data: created, error: cErr2 } = await supabase.auth.admin.createUser({
        email: contact.email,
        email_confirm: true,
        user_metadata: {
          full_name: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email,
        },
      });
      if (cErr2 || !created?.user) {
        return NextResponse.json({ error: cErr2?.message || "Échec création utilisateur" }, { status: 500 });
      }
      authUser = created.user;
    }
  }

  // 3. S'assurer que le profil existe (le trigger handle_new_user le crée normalement)
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!existingProfile) {
    await supabase.from("profiles").insert({
      id: authUser.id,
      full_name: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email,
      coaching_credits_total: Math.max(0, Math.floor(coaching_credits)),
    });
  } else if (coaching_credits > 0) {
    await supabase
      .from("profiles")
      .update({ coaching_credits_total: Math.max(0, Math.floor(coaching_credits)) })
      .eq("id", authUser.id);
  }

  // 4. Créer l'enrollment
  const { data: enrollment, error: eErr } = await supabase
    .from("enrollments")
    .insert({
      user_id: authUser.id,
      product_name,
      amount_paid: Math.floor(amount_paid * 100),
      purchased_at: new Date().toISOString(),
      status: "active",
    })
    .select()
    .single();

  if (eErr) {
    return NextResponse.json({ error: eErr.message }, { status: 500 });
  }

  // 5. Mettre à jour le contact : pipeline gagné + tag client
  const currentTags: string[] = contact.tags || [];
  const nextTags = Array.from(new Set([...currentTags, "client"]));
  await supabase
    .from("contacts")
    .update({
      pipeline_stage: "gagne",
      pipeline_updated_at: new Date().toISOString(),
      tags: nextTags,
    })
    .eq("id", id);

  return NextResponse.json({
    success: true,
    user_id: authUser.id,
    enrollment_id: enrollment?.id,
  });
}
