import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/utils/pipeline";

function startOfMonth(d = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}
function startOfToday(): string {
  return new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const monthStart = startOfMonth();
  const todayStart = startOfToday();

  const [
    { count: totalProfiles },
    { count: totalContacts },
    { count: totalEnrollments },
    { data: allEnrollments },
    { data: monthEnrollments },
    { data: recentContacts },
    { data: recentEnrollments },
    { count: totalCampaigns },
    { count: todayContacts },
    { data: pipelineAgg },
    auditRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase.from("enrollments").select("*", { count: "exact", head: true }),
    supabase.from("enrollments").select("amount_paid"),
    supabase.from("enrollments").select("amount_paid, purchased_at, product_name").gte("purchased_at", monthStart),
    supabase.from("contacts").select("id, email, first_name, last_name, source, tags, subscribed_at, pipeline_stage").order("subscribed_at", { ascending: false }).limit(8),
    supabase.from("enrollments").select("id, amount_paid, purchased_at, product_name, user_id").order("purchased_at", { ascending: false }).limit(5),
    supabase.from("email_campaigns").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }).gte("subscribed_at", todayStart),
    supabase.from("contacts").select("pipeline_stage"),
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(8),
  ]);

  const totalRevenue = (allEnrollments || []).reduce((s, e) => s + (e.amount_paid || 0), 0);
  const monthRevenue = (monthEnrollments || []).reduce((s, e) => s + (e.amount_paid || 0), 0);
  const monthSalesCount = (monthEnrollments || []).length;

  // Pipeline funnel
  const stageCounts: Record<PipelineStage, number> = {
    leads: 0, prospect: 0, rdv_pris: 0, rdv_effectif: 0, rdv_non_effectif: 0,
    offre_envoyee: 0, non_qualifie: 0, gagne: 0, perdu: 0,
  };
  for (const c of pipelineAgg || []) {
    const s = (c.pipeline_stage || "leads") as PipelineStage;
    if (s in stageCounts) stageCounts[s] += 1;
  }
  const maxStage = Math.max(...Object.values(stageCounts), 1);

  const auditLog = auditRes?.data || [];

  const stats = [
    { label: "CA ce mois-ci", value: `${(monthRevenue / 100).toLocaleString("fr-FR")}€`, sub: `${monthSalesCount} vente${monthSalesCount > 1 ? "s" : ""}`, icon: "💰", color: "text-green-600 bg-green-50", href: "/admin/eleves" },
    { label: "CA total", value: `${(totalRevenue / 100).toLocaleString("fr-FR")}€`, sub: `${totalEnrollments || 0} formations`, icon: "📦", color: "text-blue-600 bg-blue-50", href: "/admin/eleves" },
    { label: "Contacts CRM", value: totalContacts || 0, sub: `${todayContacts || 0} aujourd'hui`, icon: "👥", color: "text-purple-600 bg-purple-50", href: "/admin/contacts" },
    { label: "Élèves inscrits", value: totalProfiles || 0, icon: "🎓", color: "text-amber-600 bg-amber-50", href: "/admin/eleves" },
    { label: "Campagnes email", value: totalCampaigns || 0, icon: "📧", color: "text-red-600 bg-red-50", href: "/admin/emails" },
    { label: "Pipeline — deals gagnés", value: stageCounts.gagne, icon: "🏆", color: "text-es-green bg-es-green/10", href: "/admin/pipeline" },
  ];

  return (
    <div>
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-lg font-bold text-gray-900">Funnel commercial</h2>
          <Link href="/admin/pipeline" prefetch className="text-xs text-es-green hover:underline">Voir le pipeline →</Link>
        </div>
        <div className="space-y-2">
          {PIPELINE_STAGES.map((s) => {
            const n = stageCounts[s.key];
            const pct = Math.round((n / maxStage) * 100);
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
              </Link>
            );
          })}
        </div>
      </Card>

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
                      · {new Date(entry.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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
