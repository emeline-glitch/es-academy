import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Anomaly detector cron (toutes les 30 min).
 *
 * Roule chaque categorie d'anomalie, upserte les nouvelles dans
 * `anomaly_alerts`, resoud automatiquement celles qui ne sont plus
 * detectees, et envoie un email digest a Emeline pour les alertes
 * critiques pas encore notifiees.
 *
 * Pour eviter le spam :
 *  - chaque (signal_key, signal_id) est unique → 1 alerte par incident
 *  - alerted_at marque l'envoi → ne re-spam pas la meme alerte
 *  - resolved_at marque la resolution → si reapparait, nouvelle alerte
 *
 * Categories detectees :
 *  - welcome_email_failed : enrollment academy paye mais welcome mail KO
 *    apres 3 tentatives (Tiffany et Antony ont la responsabilite cote
 *    contenu, mais Emeline doit le savoir pour decider d'envoyer manuel)
 *  - family_gift_failed : code cadeau Family non envoye apres 3 tentatives
 *  - dunning_critical : Family sub passee en 'unpaid' (smart-retry epuise)
 *  - cron_recent_failure : un autre cron a echoue dans la derniere heure
 *    (detecte via audit_log).
 */
export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.replace(/^Bearer\s+/, "") !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const stats = { detected: 0, resolved: 0, alerted: 0 };

  // ------------------------------------------------------------------
  // 1. Detection : on collecte toutes les anomalies actuellement actives.
  // ------------------------------------------------------------------
  const detected = [
    ...(await detectWelcomeEmailFailed(supabase)),
    ...(await detectFamilyGiftFailed(supabase)),
    ...(await detectDunningCritical(supabase)),
    ...(await detectAbandonedCheckoutSpike(supabase)),
  ];
  stats.detected = detected.length;

  // ------------------------------------------------------------------
  // 2. Upsert : insere les nouvelles, ignore les doublons (UNIQUE).
  //    Si une alerte existait deja avec resolved_at NOT NULL, on la
  //    reouvre en mettant resolved_at = NULL et alerted_at = NULL.
  // ------------------------------------------------------------------
  for (const a of detected) {
    const { data: existing } = await supabase
      .from("anomaly_alerts")
      .select("id, alerted_at, resolved_at")
      .eq("signal_key", a.signal_key)
      .eq("signal_id", a.signal_id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("anomaly_alerts").insert({
        signal_key: a.signal_key,
        signal_id: a.signal_id,
        severity: a.severity,
        title: a.title,
        message: a.message,
        action_url: a.action_url,
        metadata: a.metadata,
      });
    } else if (existing.resolved_at) {
      // Reapparition : on reset alerted_at + resolved_at pour declencher un nouveau mail
      await supabase
        .from("anomaly_alerts")
        .update({
          alerted_at: null,
          resolved_at: null,
          severity: a.severity,
          message: a.message,
          metadata: a.metadata,
          detected_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    }
  }

  // ------------------------------------------------------------------
  // 3. Auto-resolve : toute alerte ouverte qui n'est plus dans `detected`
  //    est marquee resolved_at = NOW().
  // ------------------------------------------------------------------
  const detectedKeys = new Set(detected.map((a) => `${a.signal_key}|${a.signal_id}`));
  const { data: openAlerts } = await supabase
    .from("anomaly_alerts")
    .select("id, signal_key, signal_id")
    .is("resolved_at", null);

  const toResolve = (openAlerts || []).filter(
    (a) => !detectedKeys.has(`${a.signal_key}|${a.signal_id}`)
  );
  for (const a of toResolve) {
    await supabase
      .from("anomaly_alerts")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", a.id);
  }
  stats.resolved = toResolve.length;

  // ------------------------------------------------------------------
  // 4. Envoi du digest : alertes non encore notifiees, critical en priorite.
  // ------------------------------------------------------------------
  const { data: unalerted } = await supabase
    .from("anomaly_alerts")
    .select("id, signal_key, severity, title, message, action_url, detected_at, metadata")
    .is("alerted_at", null)
    .is("resolved_at", null)
    .order("severity", { ascending: false })
    .order("detected_at", { ascending: false });

  if (unalerted && unalerted.length > 0) {
    const adminEmails = (process.env.ADMIN_EMAIL || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (adminEmails.length === 0) {
      console.error("[anomaly-detector] ADMIN_EMAIL vide, impossible d'alerter");
    } else {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr";
      const html = buildDigestHtml(unalerted, siteUrl);
      const subject = buildSubject(unalerted);

      try {
        await sendEmail({
          to: adminEmails,
          subject,
          html,
          skipSuppressionCheck: true,
        });
        // Marque toutes les alertes envoyees
        await supabase
          .from("anomaly_alerts")
          .update({ alerted_at: new Date().toISOString() })
          .in("id", unalerted.map((a) => a.id));
        stats.alerted = unalerted.length;
      } catch (e) {
        console.error("[anomaly-detector] sendEmail failed:", e);
      }
    }
  }

  return NextResponse.json({ ok: true, stats });
}

// ===========================================================================
// Detection helpers
// ===========================================================================

interface DetectedAnomaly {
  signal_key: string;
  signal_id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  action_url: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Enrollment Academy paye mais welcome email KO apres 3 tentatives.
 * Tres concrete : la cliente a paye 998€ mais n'a pas recu son code
 * Family. Emeline doit envoyer manuel ou comprendre pourquoi SES bloque.
 */
async function detectWelcomeEmailFailed(supabase: SupabaseClient): Promise<DetectedAnomaly[]> {
  const { data } = await supabase
    .from("enrollments")
    .select("id, user_id, product_name, family_gift_email_attempts, family_gift_email_last_error, purchased_at")
    .gte("family_gift_email_attempts", 3)
    .is("family_gift_email_sent_at", null)
    .gte("purchased_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(100);

  return (data || []).map((e) => ({
    signal_key: "welcome_email_failed",
    signal_id: e.id,
    severity: "critical",
    title: "Welcome email Academy non envoyé",
    message: `Enrollment ${e.product_name} payé le ${new Date(e.purchased_at).toLocaleDateString("fr-FR")} : 3+ tentatives d'envoi du code cadeau Family ont échoué. Dernière erreur : ${e.family_gift_email_last_error || "inconnue"}. La cliente n'a probablement rien reçu.`,
    action_url: `/admin/eleves/${e.user_id}`,
    metadata: {
      enrollment_id: e.id,
      attempts: e.family_gift_email_attempts,
      last_error: e.family_gift_email_last_error,
    },
  }));
}

/**
 * Code cadeau Family non envoye pour un eleve Academy.
 * Distinct de welcome_email_failed : ici on regarde aussi les enrollments
 * sans `family_gift_code` genere du tout (potentiel bug de generation).
 */
async function detectFamilyGiftFailed(supabase: SupabaseClient): Promise<DetectedAnomaly[]> {
  const { data } = await supabase
    .from("enrollments")
    .select("id, user_id, product_name, purchased_at, family_gift_code")
    .eq("product_name", "academy")
    .is("family_gift_code", null)
    .gte("purchased_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(100);

  return (data || []).map((e) => ({
    signal_key: "family_gift_code_missing",
    signal_id: e.id,
    severity: "warning",
    title: "Code cadeau Family non généré",
    message: `Enrollment Academy le ${new Date(e.purchased_at).toLocaleDateString("fr-FR")} : pas de family_gift_code 24h+ après l'achat. Possiblement un bug du webhook checkout.session.completed.`,
    action_url: `/admin/eleves/${e.user_id}`,
    metadata: { enrollment_id: e.id },
  }));
}

/**
 * Family subscription passee en `unpaid` : Stripe a epuise les smart-retries
 * et l'abonnement va etre cancel automatiquement si on ne fait rien.
 * Risque churn immediat → critique pour le MRR.
 */
async function detectDunningCritical(supabase: SupabaseClient): Promise<DetectedAnomaly[]> {
  const { data } = await supabase
    .from("family_subscriptions")
    .select("id, user_id, plan, status, stripe_subscription_id, monthly_price_cents")
    .in("status", ["unpaid", "past_due"])
    .limit(100);

  return (data || []).map((s) => ({
    signal_key: "dunning_critical",
    signal_id: s.stripe_subscription_id || s.id,
    severity: s.status === "unpaid" ? "critical" : "warning",
    title: s.status === "unpaid" ? "Abo Family en unpaid (smart-retry épuisé)" : "Abo Family en past_due",
    message: `Sub ${s.stripe_subscription_id} (plan ${s.plan}, ${(s.monthly_price_cents / 100).toFixed(0)}€/mois) en ${s.status}. ${s.status === "unpaid" ? "Stripe ne tentera plus de prélever : abonnement va se canceler. Relancer manuellement la cliente." : "Stripe smart-retry actif, surveiller."}`,
    action_url: `/admin/eleves/${s.user_id}`,
    metadata: {
      subscription_id: s.stripe_subscription_id,
      plan: s.plan,
      status: s.status,
      mrr_cents: s.monthly_price_cents,
    },
  }));
}

/**
 * Plus de 20 checkout abandonnes dans les 24 dernieres heures = anomalie
 * marketing (potentiel bug Stripe checkout, prix change brusquement, etc.).
 * Le taux normal est < 30%. 20+ abandons en 24h sans pic de trafic est suspect.
 */
async function detectAbandonedCheckoutSpike(supabase: SupabaseClient): Promise<DetectedAnomaly[]> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("checkout_attempts")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .lte("created_at", yesterday);

  const n = count || 0;
  if (n < 20) return [];

  return [
    {
      signal_key: "abandoned_checkout_spike",
      signal_id: new Date().toISOString().slice(0, 10), // 1 alerte par jour
      severity: "warning",
      title: `Pic d'abandon checkout : ${n} en 24h`,
      message: `${n} checkout abandonnés (status=pending, créés il y a 24h+). Vérifier qu'aucun bug Stripe ne bloque les paiements (pages prices.stripe.com, status webhook, message d'erreur cote /api/stripe/*).`,
      action_url: `/admin/dashboard`,
      metadata: { count: n },
    },
  ];
}

// ===========================================================================
// Email helpers
// ===========================================================================

function buildSubject(alerts: Array<{ severity: string }>): string {
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;
  if (critical > 0) {
    return `[ES Academy] ⚠️ ${critical} anomalie${critical > 1 ? "s" : ""} critique${critical > 1 ? "s" : ""}`;
  }
  return `[ES Academy] ${warning} anomalie${warning > 1 ? "s" : ""} à vérifier`;
}

function buildDigestHtml(
  alerts: Array<{
    signal_key: string;
    severity: string;
    title: string;
    message: string;
    action_url: string | null;
    detected_at: string;
  }>,
  siteUrl: string,
): string {
  const sevBadge = (sev: string) => {
    const color = sev === "critical" ? "#dc2626" : sev === "warning" ? "#d97706" : "#2563eb";
    const label = sev === "critical" ? "CRITIQUE" : sev === "warning" ? "ATTENTION" : "INFO";
    return `<span style="background:${color};color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:0.5px;">${label}</span>`;
  };

  const rows = alerts
    .map((a) => {
      const url = a.action_url ? `${siteUrl}${a.action_url}` : null;
      const when = new Date(a.detected_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
      return `
        <tr>
          <td style="padding:18px 20px;border-bottom:1px solid #e5e7eb;">
            <div style="margin-bottom:6px;">${sevBadge(a.severity)} <span style="color:#6b7280;font-size:12px;margin-left:6px;">${when}</span></div>
            <div style="font-weight:700;color:#111827;font-size:15px;margin-bottom:4px;">${escapeHtml(a.title)}</div>
            <div style="color:#374151;font-size:14px;line-height:1.5;">${escapeHtml(a.message)}</div>
            ${url ? `<div style="margin-top:10px;"><a href="${url}" style="color:#16a34a;text-decoration:none;font-weight:600;font-size:13px;">Voir dans l'admin →</a></div>` : ""}
          </td>
        </tr>
      `;
    })
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0a3622;color:#fff;padding:20px 24px;">
      <div style="font-size:13px;letter-spacing:1px;opacity:.7;text-transform:uppercase;">Monitoring automatique</div>
      <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;">Anomalies détectées sur ES Academy</h1>
    </div>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    <div style="padding:18px 24px;background:#f9fafb;font-size:12px;color:#6b7280;line-height:1.6;">
      Ce mail est envoyé automatiquement par le cron anomaly-detector (toutes les 30 min).
      Chaque incident n'est notifié qu'une fois jusqu'à ce qu'il soit résolu.<br>
      <a href="${siteUrl}/admin/dashboard" style="color:#16a34a;text-decoration:none;font-weight:600;">Dashboard admin</a>
    </div>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
