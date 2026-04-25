import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { sendAcademyWelcomeEmail } from "@/lib/email/welcome-academy";

/**
 * POST /api/admin/enrollments/[id]/resend-welcome-mail
 *
 * Permet à l'admin de relancer manuellement le mail de bienvenue Academy
 * (avec code Family) pour un élève dont les 3 tentatives auto ont échoué
 * (statut "give-up"). Cas typique : SES était mal configuré au moment de
 * l'achat, l'admin fixe DKIM/sandbox/domaine puis clique "Renvoyer".
 *
 * Côté DB : reset family_gift_email_attempts à 0 pour faire sortir
 * l'enrollment de la liste give-up et permettre au cron retry de prendre
 * la relève si l'envoi manuel échoue à son tour.
 *
 * Génère un nouveau magic link à chaque appel (les liens expirent 24h).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: enrollmentId } = await params;
  const supabase = await createServiceClient();

  // Charge l'enrollment + email/full_name de l'élève
  const { data: enroll, error: loadErr } = await supabase
    .from("enrollments")
    .select("id, user_id, family_gift_code, family_gift_generated_at, installments, profiles!inner(email, full_name)")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (loadErr || !enroll) {
    return NextResponse.json({ error: "Enrollment introuvable" }, { status: 404 });
  }
  if (!enroll.family_gift_code) {
    return NextResponse.json(
      { error: "Pas de code Family genere pour cet enrollment (achat hors webhook ?)" },
      { status: 400 }
    );
  }

  const profile = (enroll.profiles as unknown) as { email: string | null; full_name: string | null };
  const email = profile?.email;
  if (!email) {
    return NextResponse.json({ error: "Email eleve introuvable" }, { status: 400 });
  }

  // Reset attempts pour sortir de la liste give-up et laisser le cron prendre
  // la relève si cet envoi manuel échoue à son tour.
  await supabase
    .from("enrollments")
    .update({
      family_gift_email_attempts: 0,
      family_gift_email_last_error: null,
    })
    .eq("id", enrollmentId);

  // Régénère un magic link (les liens type=invite/magiclink expirent 24h).
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr";
  let magicLink: string | null = null;
  try {
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${SITE_URL}/dashboard` },
    });
    magicLink = linkData?.properties?.action_link || null;
  } catch (err) {
    console.warn(
      "[resend-welcome] generateLink failed:",
      err instanceof Error ? err.message : err
    );
  }

  const firstName = (profile.full_name || "").split(" ")[0] || "";
  const result = await sendAcademyWelcomeEmail({
    supabase,
    enrollmentId,
    to: email,
    firstName,
    giftCode: enroll.family_gift_code,
    installments: enroll.installments || 1,
    magicLink,
  });

  // Audit log pour traçabilité (l'admin a forcé un renvoi).
  await supabase.from("audit_log").insert({
    actor_id: auth.userId,
    action: result.success ? "academy_welcome_resent_manually" : "academy_welcome_resend_manually_failed",
    entity_type: "enrollment",
    entity_id: enrollmentId,
    after: { email, ses_error: result.success ? null : result.error || "unknown" },
  });

  // Invalidate les pages server-component qui affichent ces compteurs.
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/eleves/${enroll.user_id}`);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Echec d'envoi du mail" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
