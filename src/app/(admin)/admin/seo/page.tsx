import { createServiceClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SeoRunAudit } from "@/components/admin/SeoRunAudit";
import { SeoRecommendations, type Recommendation } from "@/components/admin/SeoRecommendations";
import { SeoKeywords, type TargetKeyword } from "@/components/admin/SeoKeywords";
import { SITE_URL } from "@/lib/utils/constants";

export const dynamic = "force-dynamic";

interface DashboardStats {
  period_days: number;
  total_views: number;
  total_views_prev: number;
  unique_sessions: number;
  unique_sessions_prev: number;
  unique_pages: number;
  bot_views: number;
  open_recos_high: number;
  open_recos_medium: number;
  open_recos_total: number;
  tracked_keywords: number;
  last_audit_at: string | null;
}

function deltaPct(curr: number, prev: number): { value: number; up: boolean } {
  if (prev === 0) return { value: curr > 0 ? 100 : 0, up: curr > 0 };
  const diff = ((curr - prev) / prev) * 100;
  return { value: Math.abs(Math.round(diff)), up: diff >= 0 };
}

export default async function AdminSeoPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const periodDays = sp.period === "7" ? 7 : sp.period === "90" ? 90 : 30;

  const supabase = await createServiceClient();

  const [statsRes, topPagesRes, topSourcesRes, recosRes, keywordsRes] = await Promise.all([
    supabase.rpc("seo_dashboard_stats", { period_days: periodDays }),
    supabase.rpc("seo_top_pages", { period_days: periodDays, page_limit: 20 }),
    supabase.rpc("seo_top_sources", { period_days: periodDays, source_limit: 15 }),
    supabase
      .from("seo_recommendations")
      .select("id, type, severity, page_path, title, description, fix_action, status, created_at, done_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("seo_target_keywords")
      .select("*")
      .order("priority", { ascending: true })
      .order("keyword", { ascending: true }),
  ]);

  const stats = (statsRes.data as DashboardStats) || {
    period_days: periodDays,
    total_views: 0,
    total_views_prev: 0,
    unique_sessions: 0,
    unique_sessions_prev: 0,
    unique_pages: 0,
    bot_views: 0,
    open_recos_high: 0,
    open_recos_medium: 0,
    open_recos_total: 0,
    tracked_keywords: 0,
    last_audit_at: null,
  };

  const topPages = (topPagesRes.data || []) as Array<{ path: string; views: number; unique_sessions: number }>;
  const topSources = (topSourcesRes.data || []) as Array<{ source: string; sessions: number; views: number }>;
  const recos = (recosRes.data || []) as Recommendation[];
  const keywords = (keywordsRes.data || []) as TargetKeyword[];

  const viewsDelta = deltaPct(stats.total_views, stats.total_views_prev);
  const sessionsDelta = deltaPct(stats.unique_sessions, stats.unique_sessions_prev);

  const statCards = [
    {
      label: "Pages vues",
      value: stats.total_views.toLocaleString("fr-FR"),
      sub: `${stats.bot_views} vues bots ignorees`,
      delta: viewsDelta,
      icon: "👁️",
      color: "text-blue-700 bg-blue-50",
    },
    {
      label: "Visiteurs uniques",
      value: stats.unique_sessions.toLocaleString("fr-FR"),
      sub: `${stats.unique_pages} pages distinctes`,
      delta: sessionsDelta,
      icon: "👥",
      color: "text-purple-700 bg-purple-50",
    },
    {
      label: "Recommandations",
      value: stats.open_recos_total,
      sub: `${stats.open_recos_high} critiques, ${stats.open_recos_medium} moyennes`,
      delta: null,
      icon: "💡",
      color: "text-amber-700 bg-amber-50",
    },
    {
      label: "Mots-cles suivis",
      value: stats.tracked_keywords,
      sub: "Ajoute tes requetes cibles",
      delta: null,
      icon: "🎯",
      color: "text-green-700 bg-green-50",
    },
  ];

  const periodOptions = [
    { value: 7, label: "7 jours" },
    { value: 30, label: "30 jours" },
    { value: 90, label: "90 jours" },
  ];

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-es-text">SEO &amp; Analytics</h1>
          <p className="text-sm text-es-text-muted mt-1">
            Trafic, mots-cles et recommandations actionnables. Periode : {periodDays} jours.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-es-cream-dark rounded overflow-hidden">
            {periodOptions.map((o) => (
              <a
                key={o.value}
                href={`/admin/seo?period=${o.value}`}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  periodDays === o.value
                    ? "bg-es-green text-white"
                    : "bg-white text-es-text hover:bg-es-cream/50"
                }`}
              >
                {o.label}
              </a>
            ))}
          </div>
          <SeoRunAudit lastAuditAt={stats.last_audit_at} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <Card key={c.label} padding="md">
            <div className="flex items-center justify-between mb-2">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center ${c.color}`}>{c.icon}</span>
              {c.delta && (
                <span
                  className={`text-xs font-medium ${
                    c.delta.up ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {c.delta.up ? "↑" : "↓"} {c.delta.value}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-es-text">{c.value}</div>
            <div className="text-sm text-es-text-muted">{c.label}</div>
            {c.sub && <div className="text-xs text-es-text-muted mt-1">{c.sub}</div>}
          </Card>
        ))}
      </div>

      {/* Configuration / Setup */}
      <Card padding="md">
        <h2 className="font-serif text-xl font-bold mb-3">Configuration SEO</h2>
        <ul className="text-sm space-y-2">
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>
              Sitemap dynamique :{" "}
              <a
                href={`${SITE_URL}/sitemap.xml`}
                target="_blank"
                rel="noopener"
                className="text-es-green hover:underline"
              >
                /sitemap.xml
              </a>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>
              robots.txt :{" "}
              <a
                href={`${SITE_URL}/robots.txt`}
                target="_blank"
                rel="noopener"
                className="text-es-green hover:underline"
              >
                /robots.txt
              </a>
            </span>
          </li>
          <li className="flex items-center gap-2">
            {process.env.GOOGLE_SITE_VERIFICATION ? (
              <>
                <span className="text-green-600">✓</span>
                <span>Google Search Console verifie</span>
              </>
            ) : (
              <>
                <span className="text-amber-600">⚠</span>
                <span>
                  Google Search Console pas verifie. Variable d&apos;env{" "}
                  <code className="text-xs bg-es-cream-dark/50 px-1 rounded">GOOGLE_SITE_VERIFICATION</code>{" "}
                  a ajouter sur Netlify.{" "}
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener"
                    className="text-es-green hover:underline"
                  >
                    Ouvrir Search Console
                  </a>
                </span>
              </>
            )}
          </li>
          <li className="flex items-center gap-2">
            {process.env.SITE_PASSWORD ? (
              <>
                <span className="text-red-600">✗</span>
                <span className="text-red-700 font-medium">
                  Site bloque par mot de passe. Google ne peut pas crawler. Retire SITE_PASSWORD pour public.
                </span>
              </>
            ) : (
              <>
                <span className="text-green-600">✓</span>
                <span>Site public, crawlable par les moteurs</span>
              </>
            )}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>Donnees structurees JSON-LD : Organization, Course, Article, FAQ, Breadcrumb</span>
          </li>
        </ul>
      </Card>

      {/* Recommandations */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold">Recommandations actionnables</h2>
          <Badge variant={stats.open_recos_high > 0 ? "error" : "success"}>
            {stats.open_recos_total} ouverte{stats.open_recos_total > 1 ? "s" : ""}
          </Badge>
        </div>
        <SeoRecommendations recommendations={recos} />
      </Card>

      {/* Mots-cles cibles */}
      <Card padding="md">
        <h2 className="font-serif text-xl font-bold mb-3">Mots-cles cibles</h2>
        <SeoKeywords keywords={keywords} />
      </Card>

      {/* Top pages + Top sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <h2 className="font-serif text-xl font-bold mb-3">Top pages</h2>
          {topPages.length === 0 ? (
            <p className="text-sm text-es-text-muted py-6 text-center">
              Pas encore de donnees. Le tracking commence apres deploiement.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-es-cream-dark">
                    <th className="py-2 px-2 font-medium text-es-text-muted">Page</th>
                    <th className="py-2 px-2 font-medium text-es-text-muted text-right">Vues</th>
                    <th className="py-2 px-2 font-medium text-es-text-muted text-right">Visiteurs</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((p) => (
                    <tr key={p.path} className="border-b border-es-cream-dark/50">
                      <td className="py-2 px-2">
                        <a
                          href={`${SITE_URL}${p.path}`}
                          target="_blank"
                          rel="noopener"
                          className="text-es-green hover:underline font-mono text-xs"
                        >
                          {p.path}
                        </a>
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">{p.views}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{p.unique_sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card padding="md">
          <h2 className="font-serif text-xl font-bold mb-3">Sources de trafic</h2>
          {topSources.length === 0 ? (
            <p className="text-sm text-es-text-muted py-6 text-center">
              Pas encore de donnees.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-es-cream-dark">
                    <th className="py-2 px-2 font-medium text-es-text-muted">Source</th>
                    <th className="py-2 px-2 font-medium text-es-text-muted text-right">Visiteurs</th>
                    <th className="py-2 px-2 font-medium text-es-text-muted text-right">Vues</th>
                  </tr>
                </thead>
                <tbody>
                  {topSources.map((s) => (
                    <tr key={s.source} className="border-b border-es-cream-dark/50">
                      <td className="py-2 px-2">{s.source}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{s.sessions}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{s.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
