import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { renderEmailTemplate } from "@/lib/email/render-template";
import { sendEmail } from "@/lib/ses/client";

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
  let activationLink: string | null = null;

  if (!authUser) {
    // Dans tous les cas on crée l'utilisateur sans faire envoyer d'email par Supabase.
    // Si send_invite=true, on génère un lien d'invitation et on envoie notre propre email
    // avec notre template DB éditable depuis /admin/emails/templates.
    if (send_invite) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr";
      const { data: linkData, error: iErr } = await supabase.auth.admin.generateLink({
        type: "invite",
        email: contact.email,
        options: {
          redirectTo: `${siteUrl}/connexion`,
          data: {
            full_name: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email,
          },
        },
      });
      if (iErr || !linkData?.user) {
        return NextResponse.json({ error: iErr?.message || "Échec création du lien" }, { status: 500 });
      }
      authUser = linkData.user;
      activationLink = linkData.properties?.action_link || `${siteUrl}/connexion`;
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

  // 8. Envoi du mail d'invitation avec notre template DB (si demandé)
  let emailSent = false;
  let emailError: string | null = null;
  if (send_invite && activationLink) {
    const rendered = await renderEmailTemplate("invite_student", {
      prenom: contact.first_name || "",
      email: contact.email,
      activation_url: activationLink,
      product_name,
    });
    if (rendered) {
      const res = await sendEmail({
        to: contact.email,
        subject: rendered.subject,
        html: rendered.html,
        from: `${rendered.from_name} <${rendered.from_email}>`,
        replyTo: rendered.reply_to || undefined,
      });
      if (res.success) {
        emailSent = true;
      } else {
        emailError = res.error || "Échec d'envoi email";
        console.error("[promote] email send failed:", res.error);
      }
    } else {
      emailError = "Template 'invite_student' introuvable — configure-le dans /admin/emails/templates";
    }
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
    email_sent: emailSent,
    email_error: emailError,
    // Si SES pas configuré ou template absent, on retourne le lien brut pour que
    // l'admin puisse le copier/coller manuellement dans un DM.
    activation_link: !emailSent ? activationLink : undefined,
  });
}
