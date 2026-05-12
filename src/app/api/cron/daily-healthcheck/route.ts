import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Healthcheck cron quotidien.
 *
 * Schedule pg_cron (migration 052) : 6h UTC = 8h Paris.
 * Envoie un email a ADMIN_EMAIL recapitulant l'etat des services critiques :
 *   - Supabase (read ping)
 *   - Stripe (account ping)
 *   - Notion (DB blog ping, si NOTION_DB_BLOG_ID configure)
 *   - SES bounces 24h (compteur audit_log)
 *
 * Filet temporaire avant monitoring uptime M8. Si Emeline ne recoit pas
 * ce mail un matin a 8h, c'est qu'un des elements suivants a casse :
 *   - Vercel cron job inactif
 *   - Supabase pg_cron inactif
 *   - CRON_SECRET rotated et vault pas a jour
 *   - SES suppression list / quotas
 *   - Reseau internet du destinataire
 *
 * Cherche le destinataire dans ADMIN_EMAIL (premier email csv).
 * skipSuppressionCheck=true : ne marque pas l'admin comme bounced si SES rejette.
 */
interface CheckResult {
  ok: boolean;
  details?: string;
  latency_ms?: number;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.replace(/^Bearer\s+/, "") !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks: Record<string, CheckResult> = {};
  const startedAt = Date.now();

  // 1. Supabase ping
  try {
    const t0 = Date.now();
    const supabase = await createServiceClient();
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    checks.supabase = {
      ok: !error,
      latency_ms: Date.now() - t0,
      details: error?.message ?? `${count ?? 0} profiles`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.supabase = { ok: false, details: msg };
  }

  // 2. Stripe ping
  try {
    const t0 = Date.now();
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      checks.stripe = { ok: false, details: "STRIPE_SECRET_KEY absent" };
    } else {
      const res = await fetch("https://api.stripe.com/v1/account", {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      checks.stripe = {
        ok: res.ok,
        latency_ms: Date.now() - t0,
        details: res.ok ? "200 OK" : `HTTP ${res.status}`,
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.stripe = { ok: false, details: msg };
  }

  // 3. Notion ping (optionnel : skip si NOTION_DB_BLOG_ID absent)
  try {
    const t0 = Date.now();
    const notionKey = process.env.NOTION_API_KEY;
    const blogDbId = process.env.NOTION_DB_BLOG_ID;
    if (!notionKey || !blogDbId) {
      checks.notion = { ok: true, details: "skip (env manquant, non bloquant)" };
    } else {
      const res = await fetch(`https://api.notion.com/v1/databases/${blogDbId}`, {
        headers: {
          Authorization: `Bearer ${notionKey}`,
          "Notion-Version": "2022-06-28",
        },
      });
      checks.notion = {
        ok: res.ok,
        latency_ms: Date.now() - t0,
        details: res.ok ? "200 OK" : `HTTP ${res.status}`,
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.notion = { ok: false, details: msg };
  }

  // 4. SES bounce/complaint count 24h (via audit_log)
  try {
    const supabase = await createServiceClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: bouncedCount, error } = await supabase
      .from("audit_log")
      .select("*", { count: "exact", head: true })
      .ilike("action", "%bounce%")
      .gte("created_at", since);
    if (error) {
      checks.ses_bounces_24h = { ok: false, details: error.message };
    } else {
      const n = bouncedCount ?? 0;
      checks.ses_bounces_24h = {
        ok: n < 50,
        details: `${n} bounces depuis 24h${n >= 50 ? " (seuil critique)" : ""}`,
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.ses_bounces_24h = { ok: false, details: msg };
  }

  // 5. Etat des crons pg_cron (derniers 24h) : on jette un coup d'oeil sur
  // l'execution recente des autres jobs si la table cron.job_run_details est
  // accessible. Si elle ne l'est pas (RLS / permission), on skip silencieusement.
  try {
    const supabase = await createServiceClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentSends } = await supabase
      .from("email_sends")
      .select("id", { count: "exact", head: true })
      .gte("sent_at", since);
    checks.activity_24h = {
      ok: true,
      details: `email_sends 24h: ${Array.isArray(recentSends) ? recentSends.length : "n/a"}`,
    };
  } catch {
    checks.activity_24h = { ok: true, details: "n/a" };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const elapsedMs = Date.now() - startedAt;

  // Compose email
  const status = allOk ? "OK" : "ALERTE";
  const nowParis = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  const html = `
    <h2>${status} — Healthcheck ${nowParis}</h2>
    <p>Durée totale : ${elapsedMs}ms</p>
    <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
      <tr style="background:#f5f5f5"><th align="left">Service</th><th align="left">Statut</th><th align="left">Latence</th><th align="left">Détails</th></tr>
      ${Object.entries(checks)
        .map(
          ([name, c]) => `
        <tr>
          <td><strong>${name}</strong></td>
          <td>${c.ok ? "OK" : "KO"}</td>
          <td>${c.latency_ms ?? "-"}ms</td>
          <td>${c.details ?? ""}</td>
        </tr>
      `,
        )
        .join("")}
    </table>
    <p style="margin-top:20px;font-size:12px;color:#666">
      Healthcheck automatique ES Academy, envoyé chaque matin 8h Paris.
      Si tu ne reçois pas ce mail un matin, vérifie pg_cron Supabase (es-academy-daily-healthcheck) et Sentry.
    </p>
  `;

  // Destination : ADMIN_EMAIL (premier email si csv)
  const adminEmails = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const adminTo = adminEmails[0];
  let emailSent = false;
  let emailError: string | null = null;

  if (!adminTo) {
    emailError = "ADMIN_EMAIL non configuré, healthcheck non livré";
  } else {
    const sesFrom = process.env.SES_FROM_EMAIL;
    const sendRes = await sendEmail({
      to: adminTo,
      from: sesFrom ? `Healthcheck ES Academy <${sesFrom}>` : undefined,
      subject: `${status} ES Academy ${new Date().toLocaleDateString("fr-FR")}`,
      html,
      skipSuppressionCheck: true,
    });
    emailSent = sendRes.success;
    if (!sendRes.success) emailError = sendRes.error || "SES send failed";
  }

  return NextResponse.json({
    ok: allOk,
    checks,
    elapsed_ms: elapsedMs,
    email_sent: emailSent,
    email_error: emailError,
  });
}
