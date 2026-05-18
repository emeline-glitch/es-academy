import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Email digest hebdomadaire envoye a Emeline chaque lundi 7h UTC
 * (= 8-9h Paris selon saison). Resume la semaine ecoulee pour ne pas
 * avoir a ouvrir le dashboard chaque matin.
 *
 * Contenu :
 *  - CA semaine vs semaine precedente (% evolution)
 *  - Nouveaux contacts cette semaine
 *  - Top 3 sources d'acquisition
 *  - Hot leads a appeler (3+ CTAs cliques)
 *  - Alertes anomaly_alerts en cours
 *  - Sequences actives (compte d'enrollments)
 *  - Membres Family acquis
 *
 * Pour ajouter d'autres digests (mensuel, par segment, etc.) : dupliquer
 * ce pattern dans un autre endpoint + scheduler pg_cron correspondant.
 * A terme, table automation_routines avec config dynamique si volume.
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
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // ------------------------------------------------------------------
  // 1. CA semaine + semaine precedente
  // ------------------------------------------------------------------
  const [thisWeekRev, prevWeekRev] = await Promise.all([
    supabase
      .from("enrollments")
      .select("amount_paid, product_name")
      .gte("purchased_at", weekStart.toISOString())
      .lt("purchased_at", now.toISOString()),
    supabase
      .from("enrollments")
      .select("amount_paid")
      .gte("purchased_at", prevWeekStart.toISOString())
      .lt("purchased_at", weekStart.toISOString()),
  ]);
  const caWeek = (thisWeekRev.data || []).reduce((s, e) => s + (e.amount_paid || 0), 0);
  const caPrev = (prevWeekRev.data || []).reduce((s, e) => s + (e.amount_paid || 0), 0);
  const caDeltaPct = caPrev > 0 ? Math.round(((caWeek - caPrev) / caPrev) * 100) : null;
  const salesWeek = (thisWeekRev.data || []).length;
  const academySales = (thisWeekRev.data || []).filter((e) => e.product_name === "academy").length;

  // ------------------------------------------------------------------
  // 2. Nouveaux contacts cette semaine
  // ------------------------------------------------------------------
  const { count: newContacts } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .gte("subscribed_at", weekStart.toISOString());

  // ------------------------------------------------------------------
  // 3. Top 3 sources d'acquisition cette semaine
  // ------------------------------------------------------------------
  const { data: weekContacts } = await supabase
    .from("contacts")
    .select("source")
    .gte("subscribed_at", weekStart.toISOString());
  const sourceCounts: Record<string, number> = {};
  for (const c of weekContacts || []) {
    const s = c.source || "inconnue";
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  }
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // ------------------------------------------------------------------
  // 4. Hot leads (3+ CTAs cliques dans les 24h)
  // ------------------------------------------------------------------
  const { data: hotLeads } = await supabase.rpc("hot_leads", { min_distinct_ctas: 3, since_hours: 168 });

  // ------------------------------------------------------------------
  // 5. Alertes anomaly en cours (non resolues)
  // ------------------------------------------------------------------
  const { data: openAlerts } = await supabase
    .from("anomaly_alerts")
    .select("signal_key, severity, title, message")
    .is("resolved_at", null)
    .order("severity", { ascending: false })
    .limit(10);

  // ------------------------------------------------------------------
  // 6. Family : nouveaux membres + actifs
  // ------------------------------------------------------------------
  const { count: newFamily } = await supabase
    .from("family_subscriptions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekStart.toISOString())
    .in("status", ["active", "trialing"]);
  const { count: totalActiveFamily } = await supabase
    .from("family_subscriptions")
    .select("*", { count: "exact", head: true })
    .in("status", ["active", "trialing"]);

  // ------------------------------------------------------------------
  // 7. Build HTML + send
  // ------------------------------------------------------------------
  const html = buildDigestHtml({
    weekStart,
    caWeek,
    caPrev,
    caDeltaPct,
    salesWeek,
    academySales,
    newContacts: newContacts || 0,
    topSources,
    hotLeads: (hotLeads || []) as Array<{
      email: string; first_name: string | null; last_name: string | null;
      phone: string | null; distinct_ctas: number; total_clicks: number;
      cta_ids: string[]; last_click_at: string;
    }>,
    openAlerts: (openAlerts || []) as Array<{ signal_key: string; severity: string; title: string; message: string }>,
    newFamily: newFamily || 0,
    totalActiveFamily: totalActiveFamily || 0,
  });

  const adminEmails = (process.env.ADMIN_EMAIL || "")
    .split(",").map((e) => e.trim()).filter(Boolean);
  if (adminEmails.length === 0) {
    return NextResponse.json({ error: "ADMIN_EMAIL vide" }, { status: 500 });
  }

  const weekLabel = `du ${weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} au ${now.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
  try {
    await sendEmail({
      to: adminEmails,
      subject: `[ES Academy] Digest semaine ${weekLabel}`,
      html,
      skipSuppressionCheck: true,
    });
  } catch (e) {
    console.error("[weekly-digest] sendEmail failed:", e);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    sent_to: adminEmails,
    stats: {
      ca_week_cents: caWeek,
      ca_delta_pct: caDeltaPct,
      sales_week: salesWeek,
      new_contacts: newContacts || 0,
      hot_leads: hotLeads?.length || 0,
      open_alerts: openAlerts?.length || 0,
      new_family: newFamily || 0,
    },
  });
}

// ===========================================================================
// HTML builders
// ===========================================================================

interface DigestData {
  weekStart: Date;
  caWeek: number;
  caPrev: number;
  caDeltaPct: number | null;
  salesWeek: number;
  academySales: number;
  newContacts: number;
  topSources: Array<[string, number]>;
  hotLeads: Array<{
    email: string; first_name: string | null; last_name: string | null;
    phone: string | null; distinct_ctas: number; total_clicks: number;
    cta_ids: string[]; last_click_at: string;
  }>;
  openAlerts: Array<{ signal_key: string; severity: string; title: string; message: string }>;
  newFamily: number;
  totalActiveFamily: number;
}

function formatEur(cents: number): string {
  return `${Math.round(cents / 100).toLocaleString("fr-FR")}€`;
}

function buildDigestHtml(d: DigestData): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr";
  const deltaColor = d.caDeltaPct === null
    ? "#6b7280"
    : d.caDeltaPct > 0 ? "#16a34a" : d.caDeltaPct < 0 ? "#dc2626" : "#6b7280";
  const deltaLabel = d.caDeltaPct === null
    ? "—"
    : d.caDeltaPct > 0 ? `+${d.caDeltaPct}%` : `${d.caDeltaPct}%`;

  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0a3622;color:#fff;padding:20px 24px;">
      <div style="font-size:13px;letter-spacing:1px;opacity:.7;text-transform:uppercase;">Digest hebdomadaire</div>
      <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;">ES Academy · Semaine du ${d.weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</h1>
    </div>

    <!-- BIG KPI : CA semaine -->
    <div style="padding:24px;background:#f9fafb;border-bottom:1px solid #e5e7eb;text-align:center;">
      <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">CA cette semaine</div>
      <div style="font-size:42px;font-weight:800;color:#111827;margin:6px 0;">${formatEur(d.caWeek)}</div>
      <div style="font-size:14px;color:${deltaColor};font-weight:600;">${deltaLabel} vs ${formatEur(d.caPrev)} semaine passée</div>
      <div style="font-size:13px;color:#6b7280;margin-top:6px;">${d.salesWeek} vente${d.salesWeek > 1 ? "s" : ""} (${d.academySales} Academy)</div>
    </div>

    <!-- Grille 3 KPIs -->
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:18px;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;text-align:center;width:33%;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Nouveaux contacts</div>
          <div style="font-size:24px;font-weight:700;color:#111827;margin-top:4px;">${d.newContacts}</div>
        </td>
        <td style="padding:18px;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;text-align:center;width:33%;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Family acquis</div>
          <div style="font-size:24px;font-weight:700;color:#c026d3;margin-top:4px;">${d.newFamily}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">${d.totalActiveFamily} actifs au total</div>
        </td>
        <td style="padding:18px;border-bottom:1px solid #e5e7eb;text-align:center;width:33%;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Hot leads</div>
          <div style="font-size:24px;font-weight:700;color:#d97706;margin-top:4px;">${d.hotLeads.length}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">à appeler</div>
        </td>
      </tr>
    </table>

    <!-- Top sources -->
    ${d.topSources.length > 0 ? `
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
      <div style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:600;">Top 3 sources cette semaine</div>
      ${d.topSources.map(([src, n], i) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;${i < d.topSources.length - 1 ? "border-bottom:1px solid #f3f4f6;" : ""}">
          <span style="color:#374151;">${escapeHtml(src)}</span>
          <span style="font-weight:600;color:#111827;">${n} contact${n > 1 ? "s" : ""}</span>
        </div>`).join("")}
    </div>` : ""}

    <!-- Hot leads detail -->
    ${d.hotLeads.length > 0 ? `
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#fefce8;">
      <div style="font-size:13px;color:#a16207;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:600;">🔥 ${d.hotLeads.length} lead${d.hotLeads.length > 1 ? "s" : ""} chaud${d.hotLeads.length > 1 ? "s" : ""} à appeler</div>
      ${d.hotLeads.slice(0, 5).map((l) => {
        const name = [l.first_name, l.last_name].filter(Boolean).join(" ") || l.email;
        return `<div style="padding:8px 0;border-bottom:1px solid #fef3c7;">
          <div style="display:flex;justify-content:space-between;">
            <span style="font-weight:600;">${escapeHtml(name)}</span>
            <span style="color:#a16207;font-weight:600;">${l.distinct_ctas} CTAs</span>
          </div>
          <div style="font-size:11px;color:#78350f;">${escapeHtml(l.email)}${l.phone ? ` · 📞 ${escapeHtml(l.phone)}` : ""}</div>
        </div>`;
      }).join("")}
    </div>` : ""}

    <!-- Alertes -->
    ${d.openAlerts.length > 0 ? `
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#fef2f2;">
      <div style="font-size:13px;color:#991b1b;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:600;">⚠️ ${d.openAlerts.length} alerte${d.openAlerts.length > 1 ? "s" : ""} en cours</div>
      ${d.openAlerts.slice(0, 5).map((a) => `
        <div style="padding:8px 0;border-bottom:1px solid #fecaca;">
          <div style="font-weight:600;color:#991b1b;font-size:13px;">${escapeHtml(a.title)}</div>
          <div style="font-size:11px;color:#7f1d1d;margin-top:3px;">${escapeHtml(a.message.slice(0, 150))}${a.message.length > 150 ? "…" : ""}</div>
        </div>`).join("")}
    </div>` : ""}

    <!-- Footer -->
    <div style="padding:18px 24px;background:#f9fafb;font-size:12px;color:#6b7280;line-height:1.6;text-align:center;">
      Digest envoyé chaque lundi à 8h par le cron weekly-digest.<br>
      <a href="${siteUrl}/admin/dashboard" style="color:#16a34a;text-decoration:none;font-weight:600;">Voir le dashboard complet →</a>
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
