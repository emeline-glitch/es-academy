import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch all stats in parallel
  const [
    { count: totalProfiles },
    { count: totalContacts },
    { count: totalEnrollments },
    { data: enrollments },
    { data: recentContacts },
    { data: recentProgress },
    { count: totalCampaigns },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase.from("enrollments").select("*", { count: "exact", head: true }),
    supabase.from("enrollments").select("amount_paid, purchased_at, product_name").order("purchased_at", { ascending: false }).limit(10),
    supabase.from("contacts").select("email, first_name, source, tags, subscribed_at").order("subscribed_at", { ascending: false }).limit(8),
    supabase.from("progress").select("user_id, lesson_id, completed_at").order("completed_at", { ascending: false }).limit(8),
    supabase.from("email_campaigns").select("*", { count: "exact", head: true }),
  ]);

  const totalRevenue = (enrollments || []).reduce((sum, e) => sum + (e.amount_paid || 0), 0);

  // Stats for today
  const today = new Date().toISOString().split("T")[0];
  const { count: todayContacts } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .gte("subscribed_at", today);

  const stats = [
    { label: "Chiffre d'affaires", value: `${(totalRevenue / 100).toLocaleString("fr-FR")}€`, icon: "💰", color: "text-green-600 bg-green-50", href: "/admin/eleves" },
    { label: "Formations vendues", value: totalEnrollments || 0, icon: "📦", color: "text-blue-600 bg-blue-50", href: "/admin/eleves" },
    { label: "Contacts CRM", value: totalContacts || 0, icon: "👥", color: "text-purple-600 bg-purple-50", href: "/admin/contacts" },
    { label: "Élèves inscrits", value: totalProfiles || 0, icon: "🎓", color: "text-amber-600 bg-amber-50", href: "/admin/eleves" },
    { label: "Campagnes email", value: totalCampaigns || 0, icon: "📧", color: "text-red-600 bg-red-50", href: "/admin/emails" },
    { label: "Nouveaux contacts (aujourd'hui)", value: todayContacts || 0, icon: "📈", color: "text-es-green bg-es-green/10", href: "/admin/contacts" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble de votre activité</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" href="/admin/emails/new">
            Nouvelle campagne
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.href} className="block">
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dernières ventes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">Dernières ventes</h2>
            <Link href="/admin/eleves" className="text-xs text-es-green hover:underline">Voir tout →</Link>
          </div>
          {enrollments && enrollments.length > 0 ? (
            <div className="space-y-3">
              {enrollments.slice(0, 5).map((e, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
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
            <p className="text-sm text-gray-400 py-4 text-center">Aucune vente encore. Configure Stripe pour commencer.</p>
          )}
        </Card>

        {/* Derniers contacts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">Derniers contacts</h2>
            <Link href="/admin/contacts" className="text-xs text-es-green hover:underline">Voir tout →</Link>
          </div>
          {recentContacts && recentContacts.length > 0 ? (
            <div className="space-y-3">
              {recentContacts.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-900">{c.first_name || c.email}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.source === "stripe" ? "success" : "default"}>
                      {c.source}
                    </Badge>
                    <span className="text-[10px] text-gray-400">
                      {c.subscribed_at ? new Date(c.subscribed_at).toLocaleDateString("fr-FR") : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Aucun contact encore.</p>
          )}
        </Card>

        {/* Activité formation */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">Activité récente</h2>
          </div>
          {recentProgress && recentProgress.length > 0 ? (
            <div className="space-y-3">
              {recentProgress.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-es-green/10 flex items-center justify-center">
                    <span className="text-xs">✓</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Leçon complétée</p>
                    <p className="text-xs text-gray-400">
                      {p.completed_at ? new Date(p.completed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Aucune activité encore.</p>
          )}
        </Card>

        {/* Actions rapides */}
        <Card>
          <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Nouvelle campagne", href: "/admin/emails/new", icon: "✉️" },
              { label: "Voir les contacts", href: "/admin/contacts", icon: "👥" },
              { label: "Importer CSV", href: "/admin/contacts", icon: "📤" },
              { label: "Voir les tunnels", href: "/admin/tunnels", icon: "🔄" },
              { label: "Voir le blog", href: "/blog", icon: "📝" },
              { label: "Voir le site", href: "/", icon: "🌐" },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-es-green/5 transition-colors text-sm text-gray-700 hover:text-es-green"
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
