import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { formatRelative } from "@/lib/utils/format";

const STATUS_FILTERS = [
  { key: "all", label: "Toutes", countKey: null },
  { key: "draft", label: "Brouillons" },
  { key: "sent", label: "Envoyées" },
  { key: "scheduled", label: "Planifiées" },
] as const;

export default async function AdminEmails({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status || "all";
  const q = sp.q || "";

  const supabase = await createClient();

  let query = supabase
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (q) {
    query = query.ilike("subject", `%${q.replace(/%/g, "")}%`);
  }

  const { data: campaigns } = await query;

  // Récupère les counts par statut (global, ignore le filtre) pour les onglets
  const { data: allCampaigns } = await supabase.from("email_campaigns").select("status");
  const statusCounts = (allCampaigns || []).reduce<Record<string, number>>((acc, c) => {
    const s = c.status || "draft";
    acc[s] = (acc[s] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, { all: 0 });

  const totalSent = (campaigns || []).reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalOpened = (campaigns || []).reduce((acc, c) => acc + (c.open_count || 0), 0);
  const totalClicked = (campaigns || []).reduce((acc, c) => acc + (c.click_count || 0), 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const avgClickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Campagnes Email</h1>
          <p className="text-sm text-gray-500 mt-1">{statusCounts.all || 0} campagnes au total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/emails/templates"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
          >
            📨 Templates transactionnels
          </Link>
          <Button href="/admin/emails/new" variant="primary">
            + Nouvelle campagne
          </Button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900">{totalSent}</p>
          <p className="text-xs text-gray-500 mt-1">Emails envoyés</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-es-green">{avgOpenRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Taux d&apos;ouverture moyen</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{avgClickRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Taux de clic moyen</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-purple-600">{statusCounts.sent || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Campagnes envoyées</p>
        </Card>
      </div>

      {/* Filtres + search */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_FILTERS.map((f) => {
          const active = status === f.key;
          const count = statusCounts[f.key] || 0;
          const url = new URLSearchParams();
          if (f.key !== "all") url.set("status", f.key);
          if (q) url.set("q", q);
          return (
            <Link
              key={f.key}
              href={`/admin/emails${url.toString() ? `?${url}` : ""}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                active
                  ? "bg-es-green text-white border-es-green"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {f.label}
              <span className={`ml-2 text-xs ${active ? "text-white/70" : "text-gray-400"}`}>
                {count}
              </span>
            </Link>
          );
        })}
        <form method="get" className="flex-1 min-w-[200px] flex items-center gap-2 ml-auto">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un sujet…"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <button type="submit" className="text-sm text-es-green hover:underline">OK</button>
        </form>
      </div>

      {/* Campaign list */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Sujet</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Envoyés</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Ouverts</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Cliqués</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Taux ouv.</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns && campaigns.length > 0 ? (
                campaigns.map((campaign) => {
                  const openRate = campaign.sent_count > 0 ? Math.round((campaign.open_count || 0) / campaign.sent_count * 100) : 0;
                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4">
                        <Link href={`/admin/emails/${campaign.id}`} prefetch className="text-sm text-gray-900 font-medium group-hover:text-es-green transition-colors">
                          {campaign.subject}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            campaign.status === "sent" ? "success" :
                            campaign.status === "draft" ? "default" : "info"
                          }
                        >
                          {campaign.status === "sent" ? "Envoyé" : campaign.status === "draft" ? "Brouillon" : campaign.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{campaign.sent_count || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{campaign.open_count || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{campaign.click_count || 0}</td>
                      <td className="px-6 py-4">
                        {campaign.sent_count > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-es-green h-1.5 rounded-full" style={{ width: `${Math.min(openRate, 100)}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{openRate}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {formatRelative(campaign.sent_at || campaign.created_at)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    {q ? `Aucune campagne pour « ${q} »` : "Aucune campagne email. Crée ta première newsletter !"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
