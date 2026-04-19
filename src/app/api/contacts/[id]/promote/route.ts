import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

  // 2. Trouver ou créer l'utilisateur auth (via profiles.email si dispo, sinon fallback listUsers)
  let authUserId: string | null = null;
  const emailLower = contact.email.toLowerCase();

  const { data: existingByEmail, error: lookupErr } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", emailLower)
    .maybeSingle();

  if (lookupErr && /column.*email/i.test(lookupErr.message)) {
    // Fallback avant migration 005
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.users?.find((u) => u.email?.toLowerCase() === emailLower);
    authUserId = found?.id || null;
  } else if (existingByEmail) {
    authUserId = existingByEmail.id;
  }

  // 3. Si déjà un enrollment actif pour ce produit, on bloque (évite les doublons)
  if (authUserId) {
    const { data: existingEnrollment } = await supabase
      .from("enrollments")
      .select("id, product_name, status, purchased_at")
      .eq("user_id", authUserId)
      .eq("product_name", product_name)
      .eq("status", "active")
      .maybeSingle();
    if (existingEnrollment) {
      return NextResponse.json(
        {
          error: `Enrollment "${product_name}" déjà actif pour ce contact depuis le ${new Date(existingEnrollment.purchased_at).toLocaleDateString("fr-FR")}. Annule ou change de produit avant de refaire la bascule.`,
          existing_enrollment: existingEnrollment,
        },
        { status: 409 }
      );
    }
  }

  // 4. Retrouver authUser complet OU créer (en flaguant si on vient juste de le créer, pour rollback)
  let authUser = authUserId
    ? (await supabase.auth.admin.getUserById(authUserId)).data?.user
    : null;
  let createdAuthUserInThisRequest = false;

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
      createdAuthUserInThisRequest = true;
    } else {
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
      createdAuthUserInThisRequest = true;
    }
  }

  // Helper pour rollback : si on vient de créer l'auth user et qu'une étape suivante échoue,
  // on évite de laisser un user fantôme sans enrollment.
  async function rollbackIfJustCreated() {
    if (createdAuthUserInThisRequest && authUser) {
      try {
        await supabase.auth.admin.deleteUser(authUser.id);
      } catch (e) {
        console.error("[promote] rollback deleteUser failed:", e);
      }
    }
  }

  // 5. S'assurer que le profil existe (le trigger handle_new_user le crée normalement)
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!existingProfile) {
    const { error: pErr } = await supabase.from("profiles").insert({
      id: authUser.id,
      full_name: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email,
      coaching_credits_total: Math.max(0, Math.floor(coaching_credits)),
    });
    if (pErr) {
      await rollbackIfJustCreated();
      return NextResponse.json({ error: `Création profil échouée : ${pErr.message}` }, { status: 500 });
    }
  } else if (coaching_credits > 0) {
    await supabase
      .from("profiles")
      .update({ coaching_credits_total: Math.max(0, Math.floor(coaching_credits)) })
      .eq("id", authUser.id);
  }

  // 6. Créer l'enrollment — si ça échoue, on rollback le user créé pour ne pas laisser d'orphelin
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
    await rollbackIfJustCreated();
    return NextResponse.json(
      { error: `Création enrollment échouée : ${eErr.message}` },
      { status: 500 }
    );
  }

  // 7. Mettre à jour le contact : pipeline gagné + tag client
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

  // Audit log
  try {
    await supabase.from("audit_log").insert({
      actor_id: auth.userId,
      action: "contact_promoted",
      entity_type: "contact",
      entity_id: id,
      after: {
        user_id: authUser.id,
        enrollment_id: enrollment?.id,
        product_name,
        amount_paid: Math.floor(amount_paid * 100),
        coaching_credits: Math.max(0, Math.floor(coaching_credits)),
      },
    });
  } catch (e) {
    console.warn("[audit_log] promote:", e);
  }

  // Invalidate les pages server-component qui affichent ces données
  revalidatePath("/admin/contacts");
  revalidatePath(`/admin/contacts/${id}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/eleves");

  return NextResponse.json({
    success: true,
    user_id: authUser.id,
    enrollment_id: enrollment?.id,
  });
}
