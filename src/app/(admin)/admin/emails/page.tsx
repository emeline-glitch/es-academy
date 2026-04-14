import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function AdminEmails() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const totalSent = (campaigns || []).reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalOpened = (campaigns || []).reduce((acc, c) => acc + (c.open_count || 0), 0);
  const totalClicked = (campaigns || []).reduce((acc, c) => acc + (c.click_count || 0), 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const avgClickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Campagnes Email</h1>
          <p className="text-sm text-gray-500 mt-1">{(campaigns || []).length} campagnes</p>
        </div>
        <Button href="/admin/emails/new" variant="primary">
          Nouvelle campagne
        </Button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900">{totalSent}</p>
          <p className="text-xs text-gray-500 mt-1">Emails envoyés</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-es-green">{avgOpenRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Taux d'ouverture moyen</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{avgClickRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Taux de clic moyen</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-purple-600">{(campaigns || []).filter((c) => c.status === "sent").length}</p>
          <p className="text-xs text-gray-500 mt-1">Campagnes envoyées</p>
        </Card>
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
                        <Link href={`/admin/emails/${campaign.id}`} className="text-sm text-gray-900 font-medium group-hover:text-es-green transition-colors">
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {campaign.sent_at
                          ? new Date(campaign.sent_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
                          : new Date(campaign.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    Aucune campagne email. Crée ta première newsletter !
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
