import type { createServiceClient } from "@/lib/supabase/server";
import { renderEmailTemplate } from "@/lib/email/render-template";
import { sendEmail } from "@/lib/ses/client";
import { getPaymentLabel } from "@/lib/config/app-config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

type SupabaseService = Awaited<ReturnType<typeof createServiceClient>>;

export interface SendAcademyWelcomeArgs {
  supabase: SupabaseService;
  enrollmentId: string | undefined;
  to: string;
  firstName: string;
  giftCode: string;
  installments: number;
  /** Magic link d'activation Supabase (générée par generateLink type=invite).
   *  Null si l'user existait déjà : le template renvoie alors vers /connexion. */
  magicLink?: string | null;
}

/**
 * Envoie le mail de bienvenue Academy avec le code cadeau ES Family.
 * Tracke chaque tentative (succès ou échec) via la RPC record_academy_welcome_email_send.
 * Le cron /api/cron/retry-academy-welcome-mail réutilise la même fonction si SES fail.
 */
export async function sendAcademyWelcomeEmail(args: SendAcademyWelcomeArgs): Promise<{ success: boolean; error?: string }> {
  const familyActivationUrl = `${SITE_URL}/family?code=${encodeURIComponent(args.giftCode)}`;
  // Wording paiement lu depuis app_config (editable admin sans deploiement).
  // Fallback hardcodé si la table est inaccessible ou la clé manquante.
  const paymentLabel = await getPaymentLabel(args.supabase, args.installments);

  // magic_link est toujours fourni au template :
  //   - new user (action_link signé via type=invite/magiclink) : active la session sans password
  //   - user existant sans link : fallback sur /connexion (où il peut entrer son password ou cliquer "mot de passe oublié")
  const rendered = await renderEmailTemplate("academy_welcome_with_family_gift", {
    prenom: args.firstName,
    email: args.to,
    family_gift_code: args.giftCode,
    family_activation_url: familyActivationUrl,
    payment_label: paymentLabel,
    site_url: SITE_URL,
    magic_link: args.magicLink || `${SITE_URL}/connexion`,
  });

  if (!rendered) {
    const errMsg = "Template 'academy_welcome_with_family_gift' introuvable en DB";
    console.error("[welcome-academy]", errMsg);
    await recordEmailSendOutcome(args.supabase, args.enrollmentId, false, errMsg);
    return { success: false, error: errMsg };
  }

  const result = await sendEmail({
    to: args.to,
    subject: rendered.subject,
    html: rendered.html,
    from: `${rendered.from_name} <${rendered.from_email}>`,
    replyTo: rendered.reply_to ?? undefined,
  });

  if (!result.success) {
    console.error("[welcome-academy] SES fail:", result.error);
  }
  await recordEmailSendOutcome(
    args.supabase,
    args.enrollmentId,
    result.success,
    result.success ? null : result.error || "unknown"
  );
  return result;
}

/**
 * Centralise la mise à jour atomique du tracking + l'audit_log de give-up
 * (>= 3 tentatives échouées sans succès). L'admin verra la carte
 * "Mails Family non envoyés" sur le dashboard.
 */
export async function recordEmailSendOutcome(
  supabase: SupabaseService,
  enrollmentId: string | undefined,
  success: boolean,
  errorMsg: string | null
): Promise<number | null> {
  if (!enrollmentId) return null;

  const { data: attempts, error: rpcErr } = await supabase.rpc(
    "record_academy_welcome_email_send",
    {
      p_enrollment_id: enrollmentId,
      p_success: success,
      p_error_msg: errorMsg,
    }
  );
  if (rpcErr) {
    console.error("[welcome-academy] RPC record failed:", rpcErr.message);
    return null;
  }

  if (!success && typeof attempts === "number" && attempts >= 3) {
    const { error: auditErr } = await supabase.from("audit_log").insert({
      action: "academy_welcome_email_failed_giveup",
      entity_type: "enrollment",
      entity_id: enrollmentId,
      after: { attempts, last_error: errorMsg },
    });
    if (auditErr) {
      console.error("[welcome-academy] audit_log insert failed:", auditErr.message);
    }
  }

  return typeof attempts === "number" ? attempts : null;
}
