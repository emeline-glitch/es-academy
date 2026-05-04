import type { createServiceClient } from "@/lib/supabase/server";
import { renderEmailTemplate } from "@/lib/email/render-template";
import { sendEmail } from "@/lib/ses/client";
import { generateFamilyMagicLink } from "@/lib/sync/family-sync";

type SupabaseService = Awaited<ReturnType<typeof createServiceClient>>;

export interface SendFamilyWelcomeArgs {
  supabase: SupabaseService;
  /** id de la row family_subscriptions (pour update du tracking welcome_email_*) */
  subscriptionId: string | undefined;
  to: string;
  firstName: string;
  plan: "fondateur" | "standard";
}

/**
 * Envoie le mail de bienvenue ES Family après une inscription via Stripe Checkout
 * (mode subscription, scope=family). Tracke succès/échec dans family_subscriptions.
 *
 * Le template DB welcome_purchase_family attend les variables :
 *   prenom, email, community_url
 *
 * Comportement idempotent côté webhook : appelé seulement si welcome_email_sent_at
 * est null sur la subscription. Si SES fail, le compteur welcome_email_attempts
 * incrémente et un cron de retry pourra re-tenter (à implémenter Phase 2).
 */
export async function sendFamilyWelcomeEmail(
  args: SendFamilyWelcomeArgs
): Promise<{ success: boolean; error?: string }> {
  // PLACEHOLDERS app stores : URLs d'app Family pas encore connues au 2026-05-04
  // (Apple Developer enroll en cours, publication prévue pour le 3 juin 2026).
  // Mêmes valeurs que dans src/app/family/bienvenue/page.tsx (à updater en
  // parallèle quand les vraies URLs seront disponibles).
  const APP_STORE_URL = "https://apps.apple.com/X";
  const PLAY_STORE_URL = "https://play.google.com/store/apps/X";

  // Magic link Supabase Family : auto-login l'user sur esfamily.fr sans qu'il
  // ait à inventer un mot de passe (le compte vient d'être créé par le webhook
  // avec email_confirm=true, donc pas de password set). Si génération fail
  // (network blip), on fallback sur l'URL de connexion classique.
  const magicLink =
    (await generateFamilyMagicLink(args.to, "https://esfamily.fr/feed")) ||
    "https://esfamily.fr/connexion";

  const rendered = await renderEmailTemplate("welcome_purchase_family", {
    prenom: args.firstName,
    email: args.to,
    login_url: magicLink,
    app_store_url: APP_STORE_URL,
    play_store_url: PLAY_STORE_URL,
  });

  if (!rendered) {
    const errMsg = "Template 'welcome_purchase_family' introuvable en DB";
    console.error("[welcome-family]", errMsg);
    await recordEmailSendOutcome(args.supabase, args.subscriptionId, false, errMsg);
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
    console.error("[welcome-family] SES fail:", result.error);
  }
  await recordEmailSendOutcome(
    args.supabase,
    args.subscriptionId,
    result.success,
    result.success ? null : result.error || "unknown"
  );
  return result;
}

/**
 * Update les colonnes welcome_email_* sur family_subscriptions.
 * Lit-puis-écrit (2 round trips) plutôt qu'une RPC SQL atomique : pour le MVP
 * volume sera très faible (quelques inscriptions/jour), pas de risque de race
 * condition critique. À convertir en RPC si volume > 10/min.
 */
async function recordEmailSendOutcome(
  supabase: SupabaseService,
  subscriptionId: string | undefined,
  success: boolean,
  errorMsg: string | null
): Promise<void> {
  if (!subscriptionId) return;

  const { data: current } = await supabase
    .from("family_subscriptions")
    .select("welcome_email_attempts")
    .eq("id", subscriptionId)
    .maybeSingle();

  const updates: Record<string, unknown> = {
    welcome_email_attempts: ((current?.welcome_email_attempts as number) || 0) + 1,
    welcome_email_last_attempt_at: new Date().toISOString(),
    welcome_email_last_error: success ? null : errorMsg,
  };
  if (success) {
    updates.welcome_email_sent_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("family_subscriptions")
    .update(updates)
    .eq("id", subscriptionId);
  if (error) {
    console.error("[welcome-family] tracking update failed:", error.message);
  }
}
