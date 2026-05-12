import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses/client";

/**
 * POST /api/rgpd/delete
 *
 * Demande de suppression RGPD article 17. La suppression n'est PAS
 * exécutée immédiatement :
 *
 *  1. Vérification d'identité requise (cookie auth seul ne suffit pas si
 *     l'attaquant a volé une session).
 *  2. Obligations légales de conservation : factures Stripe 10 ans (Code
 *     du commerce), logs d'audit (anti-fraude). On garde ces données
 *     pseudonymisées, on anonymise le reste.
 *  3. Une suppression hard immédiate via l'API est risquée : une erreur
 *     supprime des factures comptables sans recours.
 *
 * Workflow :
 *  - On envoie un email au support avec les infos de la demande.
 *  - On log dans consent_log (preuve d'exercice du droit).
 *  - On log dans audit_log (audit trail interne).
 *  - Le support traite manuellement sous 30 jours (délai RGPD max),
 *    confirme par email, puis exécute la suppression via /admin/.
 *
 * Auth : cookie session Supabase. 401 si non connecté.
 */

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "contact@emeline-siron.fr";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const admin = await createServiceClient();
  const userEmail = (user.email || "").toLowerCase();
  const requestedAt = new Date().toISOString();

  // 1. Notifier le support par email. Si SES n'est pas configuré (env vars
  //    manquantes), on continue quand même : la demande est loggée et
  //    Emeline la verra dans audit_log via l'admin.
  const adminHref = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/users?id=${user.id}`
    : `/admin/users?id=${user.id}`;

  const html = `
    <h2>Demande de suppression de compte (RGPD article 17)</h2>
    <p><strong>Email :</strong> ${escapeHtml(userEmail)}</p>
    <p><strong>User ID :</strong> ${user.id}</p>
    <p><strong>Date de la demande :</strong> ${requestedAt}</p>
    <p>Action requise sous 30 jours :</p>
    <ol>
      <li>Vérifier l'identité du demandeur (répondre depuis l'adresse mail liée au compte).</li>
      <li>Confirmer par email à l'élève.</li>
      <li>Exécuter la suppression depuis l'admin : <a href="${adminHref}">${adminHref}</a></li>
      <li>Conserver les factures Stripe pseudonymisées (10 ans, Code du commerce).</li>
    </ol>
    <p style="color: #666; font-size: 12px; margin-top: 24px;">
      Cette demande a été initiée par l'élève depuis sa page profil. Si tu reçois ce mail sans avoir initié la demande, contacte immédiatement le support.
    </p>
  `;

  const emailRes = await sendEmail({
    to: SUPPORT_EMAIL,
    subject: `[RGPD] Demande suppression compte : ${userEmail}`,
    html,
    replyTo: userEmail,
  });

  // 2. Trace dans consent_log (preuve d'exercice du droit RGPD).
  //    Schéma : contact_id, consent_type (enum), consent_basis, consent_proof (JSONB).
  //    Lookup contact_id par email pour relier si la ligne CRM existe.
  const { data: contactRow } = await admin
    .from("contacts")
    .select("id")
    .eq("email", userEmail)
    .maybeSingle();

  await admin.from("consent_log").insert({
    contact_id: contactRow?.id || null,
    consent_type: "opt_out",
    consent_basis: "gdpr_article_17_self_service",
    consent_proof: {
      email: userEmail,
      user_id: user.id,
      requested_at: requestedAt,
      ses_message_id: emailRes.messageId || null,
      ses_error: emailRes.success ? null : emailRes.error,
    },
  });

  // 3. Audit log interne.
  await admin.from("audit_log").insert({
    actor_id: user.id,
    actor_email: userEmail,
    action: "gdpr_deletion_request_submitted",
    entity_type: "user",
    entity_id: user.id,
    after: {
      email: userEmail,
      requested_at: requestedAt,
      support_notified: emailRes.success,
    },
  });

  return NextResponse.json({
    success: true,
    message:
      "Ta demande a été enregistrée. Tu recevras un email de confirmation sous 48h, et la suppression sera effective sous 30 jours maximum.",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
