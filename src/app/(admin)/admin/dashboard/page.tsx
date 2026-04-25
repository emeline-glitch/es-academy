import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/utils/pipeline";
import { formatRelative } from "@/lib/utils/format";
import { DashboardRealtime } from "@/components/admin/DashboardRealtime";

function startOfMonth(d = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}
function startOfToday(): string {
  return new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
}

interface DashboardStats {
  total_profiles: number;
  total_contacts: number;
  today_contacts: number;
  total_enrollments: number;
  total_revenue: number;
  month_revenue: number;
  month_sales_count: number;
  total_campaigns: number;
  pipeline_counts: Record<string, number>;
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const monthStart = startOfMonth();
  const todayStart = startOfToday();

  // Un seul RPC pour tous les compteurs/sommes (au lieu de charger toutes les lignes et sommer en JS).
  // + 3 queries parallèles pour les listes "récentes" qui sont déjà limit(5-8).
  // + extensions Sprint 4 : LM perf, alumni, quiz distribution, Chatel upcoming.
  const [
    statsRes, recentContactsRes, recentEnrollmentsRes, auditRes,
    lmPerfRes, alumniRes, chatelRes, quizRes, welcomeFailedRes,
  ] = await Promise.all([
    supabase.rpc("dashboard_stats", { month_start: monthStart, today_start: todayStart }),
    supabase
      .from("contacts")
      .select("id, email, first_name, last_name, source, tags, subscribed_at, pipeline_stage")
      .order("subscribed_at", { ascending: false })
      .limit(8),
    supabase
      .from("enrollments")
      .select("id, amount_paid, purchased_at, product_name, user_id")
      .order("purchased_at", { ascending: false })
      .limit(5),
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.rpc("lead_magnets_performance", { period_days: 30 }),
    supabase.rpc("alumni_dashboard"),
    supabase
      .from("billing_reminders")
      .select("id, contact_id, trial_end, monthly_price_cents, reminder_j15_sent_at, reminder_j7_sent_at")
      .is("cancelled_at", null)
      .is("activation_confirmed_at", null)
      .gte("trial_end", new Date().toISOString().slice(0, 10))
      .lte("trial_end", new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10))
      .order("trial_end", { ascending: true })
      .limit(10),
    supabase
      .from("quiz_responses")
      .select("result_category")
      .gte("completed_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
    supabase.rpc("academy_welcome_email_failed_count"),
  ]);
  const welcomeFailedCount = (welcomeFailedRes?.data as number | null) || 0;

  const stats: DashboardStats = (statsRes.data as DashboardStats) || {
    total_profiles: 0, total_contacts: 0, today_contacts: 0,
    total_enrollments: 0, total_revenue: 0, month_revenue: 0, month_sales_count: 0,
    total_campaigns: 0, pipeline_counts: {},
  };
  const recentContacts = recentContactsRes.data;
  const recentEnrollments = recentEnrollmentsRes.data;

  const totalProfiles = stats.total_profiles;
  const totalContacts = stats.total_contacts;
  const totalEnrollments = stats.total_enrollments;
  const totalRevenue = stats.total_revenue;
  const monthRevenue = stats.month_revenue;
  const monthSalesCount = stats.month_sales_count;
  const totalCampaigns = stats.total_campaigns;
  const todayContacts = stats.today_contacts;

  // Pipeline funnel
  const stageCounts: Record<PipelineStage, number> = {
    leads: 0, prospect: 0, rdv_pris: 0, rdv_effectif: 0, rdv_non_effectif: 0,
    offre_envoyee: 0, non_qualifie: 0, gagne: 0, perdu: 0,
  };
  for (const [key, n] of Object.entries(stats.pipeline_counts || {})) {
    if (key in stageCounts) stageCounts[key as PipelineStage] = n as number;
  }
  const maxStage = Math.max(...Object.values(stageCounts), 1);
  const totalInPipeline = Object.values(stageCounts).reduce((a, b) => a + b, 0);
  // Taux de conversion : % de gagne parmi les contacts qui ont été scorés (hors leads)
  const scored = totalInPipeline - stageCounts.leads;
  const winRate = scored > 0 ? Math.round((stageCounts.gagne / scored) * 100) : 0;

  const auditLog = auditRes?.data || [];

  // Extensions Sprint 4
  const lmPerf = (lmPerfRes.data || []) as Array<{ lead_magnet_slug: string; lead_magnet_name: string; opt_ins: number; conversions_to_academy: number; conversion_rate: number }>;
  const alumniData = (alumniRes.data as { total_alumni: number; migrated: number; family_activated: number; family_cancelled: number; opted_out: number } | null) || null;
  const chatelUpcoming = (chatelRes.data || []) as Array<{ id: string; contact_id: string; trial_end: string; monthly_price_cents: number; reminder_j15_sent_at: string | null; reminder_j7_sent_at: string | null }>;

  const quizCounts = { tu_perds_argent: 0, operation_blanche: 0, autofinancement_positif: 0 };
  for (const r of (quizRes.data || []) as Array<{ result_category: string }>) {
    if (r.result_category in quizCounts) quizCounts[r.result_category as keyof typeof quizCounts]++;
  }
  const totalQuiz = quizCounts.tu_perds_argent + quizCounts.operation_blanche + quizCounts.autofinancement_positif;

  const statCards = [
    { label: "CA ce mois-ci", value: `${(monthRevenue / 100).toLocaleString("fr-FR")}€`, sub: `${monthSalesCount} vente${monthSalesCount > 1 ? "s" : ""}`, icon: "💰", color: "text-green-600 bg-green-50", href: "/admin/eleves" },
    { label: "CA total", value: `${(totalRevenue / 100).toLocaleString("fr-FR")}€`, sub: `${totalEnrollments || 0} formations`, icon: "📦", color: "text-blue-600 bg-blue-50", href: "/admin/eleves" },
    { label: "Contacts CRM", value: totalContacts || 0, sub: `${todayContacts || 0} aujourd'hui`, icon: "👥", color: "text-purple-600 bg-purple-50", href: "/admin/contacts" },
    { label: "Élèves inscrits", value: totalProfiles || 0, icon: "🎓", color: "text-amber-600 bg-amber-50", href: "/admin/eleves" },
    { label: "Campagnes email", value: totalCampaigns || 0, icon: "📧", color: "text-red-600 bg-red-50", href: "/admin/emails" },
    { label: "Pipeline — deals gagnés", value: stageCounts.gagne, icon: "🏆", color: "text-es-green bg-es-green/10", href: "/admin/pipeline" },
  ];

  return (
    <div>
      {/* Listener realtime : quand un contact bouge dans le pipeline ou qu'un enrollment
          est créé, déclenche un router.refresh() pour que ce server-component re-fetch
          ses stats à jour (debounced 800ms). */}
      <DashboardRealtime />

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" href="/admin/pipeline">Pipeline</Button>
          <Button variant="primary" size="sm" href="/admin/emails/new">Nouvelle campagne</Button>
        </div>
      </div>

      {welcomeFailedCount > 0 && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-600 text-xl shrink-0">⚠️</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">
                {welcomeFailedCount} mail{welcomeFailedCount > 1 ? "s" : ""} de bienvenue Academy non envoyé{welcomeFailedCount > 1 ? "s" : ""} après 3 tentatives
              </p>
              <p className="text-xs text-red-600 mt-1">
                Ces élèves ont payé mais n&apos;ont pas reçu leur code cadeau ES Family. Vérifie SES (DKIM, sandbox, domaine vérifié), puis remets le compteur à zéro côté DB pour relancer le retry automatique : <code className="bg-red-100 px-1 rounded">UPDATE enrollments SET family_gift_email_attempts = 0 WHERE family_gift_email_attempts &gt;= 3 AND family_gift_email_sent_at IS NULL</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <Link key={i} href={stat.href} prefetch className="block">
            <Card className="hover:shadow-md transition-shadow h-full">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                  {stat.sub && <div className="text-[11px] text-gray-400 mt-0.5">{stat.sub}</div>}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pipeline funnel */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-gray-900">Funnel commercial</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalInPipeline} contacts · <span className="text-es-green font-semibold">{winRate}% de taux de conversion</span>
              <span className="text-gray-400"> (hors leads)</span>
            </p>
          </div>
          <Link href="/admin/pipeline" prefetch className="text-xs text-es-green hover:underline">Voir le pipeline →</Link>
        </div>
        <div className="space-y-2">
          {PIPELINE_STAGES.map((s) => {
            const n = stageCounts[s.key];
            const pct = Math.round((n / maxStage) * 100);
            const stagePctOfTotal = totalInPipeline > 0 ? Math.round((n / totalInPipeline) * 100) : 0;
            return (
              <Link
                key={s.key}
                href={`/admin/pipeline`}
                prefetch
                className="flex items-center gap-3 group hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2"
              >
                <span className={`text-xs font-semibold w-36 shrink-0 ${s.textColor}`}>{s.label}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden relative">
                  <div
                    className={`h-full ${s.color.split(" ")[0]} border-r-2 ${s.color.split(" ")[1]} transition-all`}
                    style={{ width: `${Math.max(pct, n > 0 ? 4 : 0)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-xs font-bold text-gray-700">
                    {n}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 w-12 shrink-0 text-right">{stagePctOfTotal}%</span>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Sprint 4 : 4 nouvelles cards performance */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Lead magnets perf 30j */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-gray-900">Lead magnets (30j)</h2>
              <p className="text-xs text-gray-500 mt-0.5">Opt-ins, conversions Academy, taux</p>
            </div>
            <Link href="/admin/lead-magnets" prefetch className="text-xs text-es-green hover:underline">Gérer →</Link>
          </div>
          {lmPerf.length > 0 ? (
            <div className="space-y-2">
              {lmPerf.slice(0, 5).map((lm) => (
                <div key={lm.lead_magnet_slug} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 truncate flex-1">{lm.lead_magnet_name}</span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">
                    <span className="font-bold text-gray-900">{lm.opt_ins}</span> opt-ins · {lm.conversion_rate}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic py-4 text-center">Aucun lead magnet configuré. <Link href="/admin/lead-magnets" className="text-es-green hover:underline">En créer un →</Link></p>
          )}
        </Card>

        {/* Quiz distribution 30j */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-gray-900">Quiz investisseur (30j)</h2>
              <p className="text-xs text-gray-500 mt-0.5">{totalQuiz} quiz complétés</p>
            </div>
          </div>
          {totalQuiz > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs w-40 shrink-0 text-gray-700">Tu perds de l&apos;argent</span>
                <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full bg-red-400" style={{ width: `${(quizCounts.tu_perds_argent / totalQuiz) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-900 w-10 text-right">{quizCounts.tu_perds_argent}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-40 shrink-0 text-gray-700">Opération blanche</span>
                <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${(quizCounts.operation_blanche / totalQuiz) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-900 w-10 text-right">{quizCounts.operation_blanche}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-40 shrink-0 text-gray-700">Autofinancement positif</span>
                <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full bg-es-green" style={{ width: `${(quizCounts.autofinancement_positif / totalQuiz) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-900 w-10 text-right">{quizCounts.autofinancement_positif}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic py-4 text-center">Aucune réponse quiz pour le moment.</p>
          )}
        </Card>

        {/* Loi Chatel upcoming */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-gray-900">Rappels loi Chatel (30j)</h2>
              <p className="text-xs text-gray-500 mt-0.5">ES Family trial à facturer bientôt</p>
            </div>
          </div>
          {chatelUpcoming.length > 0 ? (
            <div className="space-y-2">
              {chatelUpcoming.slice(0, 5).map((r) => {
                const daysUntil = Math.ceil((new Date(r.trial_end).getTime() - Date.now()) / (24 * 3600 * 1000));
                const reminderStatus = r.reminder_j15_sent_at ? "J-15 ✓" : daysUntil <= 15 ? "J-15 à envoyer" : "à venir";
                return (
                  <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 text-xs">
                    <Link href={`/admin/contacts/${r.contact_id}`} className="text-gray-700 hover:text-es-green truncate flex-1">
                      Contact #{r.contact_id.slice(0, 8)}
                    </Link>
                    <span className="text-gray-500 mx-2">J-{daysUntil}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${r.reminder_j15_sent_at ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {reminderStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic py-4 text-center">Aucun rappel Chatel dans les 30 prochains jours.</p>
          )}
        </Card>

        {/* Alumni Evermind */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-gray-900">Alumni Evermind</h2>
              <p className="text-xs text-gray-500 mt-0.5">Migration + activation ES Family</p>
            </div>
          </div>
          {alumniData && alumniData.total_alumni > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-[10px] text-gray-500 uppercase">Total alumni</p>
                <p className="text-2xl font-bold text-gray-900">{alumniData.total_alumni}</p>
              </div>
              <div className="bg-es-green/5 p-3 rounded">
                <p className="text-[10px] text-gray-500 uppercase">Family activé</p>
                <p className="text-2xl font-bold text-es-green">{alumniData.family_activated}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded">
                <p className="text-[10px] text-gray-500 uppercase">Migrés</p>
                <p className="text-xl font-bold text-amber-600">{alumniData.migrated}</p>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <p className="text-[10px] text-gray-500 uppercase">Opt-out</p>
                <p className="text-xl font-bold text-red-500">{alumniData.opted_out}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic py-4 text-center">Aucun alumni importé encore. <Link href="/admin/import-contacts" className="text-es-green hover:underline">Importer la liste →</Link></p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Dernières ventes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">Dernières ventes</h2>
            <Link href="/admin/eleves" prefetch className="text-xs text-es-green hover:underline">Voir tout →</Link>
          </div>
          {recentEnrollments && recentEnrollments.length > 0 ? (
            <div className="space-y-3">
              {recentEnrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant={e.product_name === "expert" ? "warning" : "success"}>
                      {e.product_name}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {e.purchased_at ? new Date(e.purchased_at).toLocaleDateString("fr-FR") : "—"}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900 text-sm">
                    {(e.amount_paid / 100).toLocaleString("fr-FR")}€
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Aucune vente pour l&apos;instant.</p>
          )}
        </Card>

        {/* Derniers contacts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">Derniers contacts</h2>
            <Link href="/admin/contacts" prefetch className="text-xs text-es-green hover:underline">Voir tout →</Link>
          </div>
          {recentContacts && recentContacts.length > 0 ? (
            <div className="space-y-2">
              {recentContacts.slice(0, 6).map((c) => {
                const stage = PIPELINE_STAGES.find((s) => s.key === (c.pipeline_stage || "leads"));
                const name = [c.first_name, (c as { last_name?: string }).last_name].filter(Boolean).join(" ") || c.email;
                return (
                  <Link
                    key={c.id}
                    href={`/admin/contacts/${c.id}`}
                    prefetch
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 truncate">{name}</p>
                      <p className="text-xs text-gray-400 truncate">{c.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {stage && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stage.color} ${stage.textColor}`}>
                          {stage.label}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {c.subscribed_at ? new Date(c.subscribed_at).toLocaleDateString("fr-FR") : ""}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Aucun contact encore.</p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activité récente (audit log) */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">Activité récente</h2>
          </div>
          {auditLog.length > 0 ? (
            <div className="space-y-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-es-green/10 flex items-center justify-center text-xs shrink-0">
                    {entry.action === "pipeline_stage_change" ? "🔄" : entry.action === "contact_promoted" ? "🎓" : "✏️"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">
                      {entry.action === "pipeline_stage_change" && (
                        <>
                          Stage changé :{" "}
                          <span className="font-medium">
                            {(entry.before as Record<string, string> | null)?.pipeline_stage || "?"} → {(entry.after as Record<string, string> | null)?.pipeline_stage || "?"}
                          </span>
                        </>
                      )}
                      {entry.action === "contact_promoted" && (
                        <>Contact basculé en élève ({(entry.after as Record<string, string> | null)?.product_name})</>
                      )}
                      {!["pipeline_stage_change", "contact_promoted"].includes(entry.action) && <>{entry.action}</>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {entry.entity_type && entry.entity_id && (
                        <Link href={`/admin/contacts/${entry.entity_id}`} className="text-es-green hover:underline">
                          voir →
                        </Link>
                      )}{" "}
                      · {formatRelative(entry.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center italic">Aucune activité enregistrée encore. L&apos;audit log tracera les changements d&apos;étapes pipeline et les bascules élèves.</p>
          )}
        </Card>

        {/* Actions rapides */}
        <Card>
          <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Ajouter un contact", href: "/admin/contacts", icon: "➕" },
              { label: "Voir le pipeline", href: "/admin/pipeline", icon: "🎯" },
              { label: "Gérer les listes", href: "/admin/lists", icon: "📋" },
              { label: "Nouvelle campagne", href: "/admin/emails/new", icon: "✉️" },
              { label: "Importer CSV", href: "/admin/contacts", icon: "📤" },
              { label: "Voir le site", href: "/", icon: "🌐" },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                prefetch
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-es-green/5 hover:border-es-green/30 border border-transparent transition-colors text-sm text-gray-700 hover:text-es-green"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
