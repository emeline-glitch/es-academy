"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useParams } from "next/navigation";

interface CampaignDetail {
  id: string;
  subject: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  sent_count: number;
  open_count: number;
  click_count: number;
  html_content: string;
  target_tag: string | null;
}

interface SendRecord {
  id: string;
  contact_id: string;
  status: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  clicked_links: string[];
  contact: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface LinkStat {
  url: string;
  clicks: number;
  clickers: { email: string; name: string; clicked_at: string }[];
}

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [sends, setSends] = useState<SendRecord[]>([]);
  const [linkStats, setLinkStats] = useState<LinkStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "recipients" | "links" | "clickers">("overview");
  const [selectedLink, setSelectedLink] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaignData();
  }, [campaignId]);

  async function fetchCampaignData() {
    setLoading(true);
    const res = await fetch(`/api/emails/campaigns/${campaignId}`);
    if (res.ok) {
      const data = await res.json();
      setCampaign(data.campaign);
      setSends(data.sends || []);
      setLinkStats(data.link_stats || []);
    }
    setLoading(false);
  }

  function exportRecipients(filter?: "opened" | "clicked") {
    let data = sends;
    if (filter === "opened") data = sends.filter((s) => s.opened_at);
    if (filter === "clicked") data = sends.filter((s) => s.clicked_at);

    const rows = ["email,prenom,nom,statut,ouvert,cliqué,liens_cliqués"];
    for (const s of data) {
      rows.push(
        `${s.contact.email},${s.contact.first_name},${s.contact.last_name},${s.status},${s.opened_at ? "oui" : "non"},${s.clicked_at ? "oui" : "non"},"${(s.clicked_links || []).join(";")}"`
      );
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campagne_${campaignId}_${filter || "tous"}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  function exportLinkClickers(linkUrl: string) {
    const stat = linkStats.find((l) => l.url === linkUrl);
    if (!stat) return;
    const rows = ["email,nom,date_clic"];
    for (const c of stat.clickers) {
      rows.push(`${c.email},${c.name},${c.clicked_at}`);
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clics_lien_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;
  }

  if (!campaign) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Campagne introuvable</div>;
  }

  const openRate = campaign.sent_count > 0 ? Math.round((campaign.open_count / campaign.sent_count) * 100) : 0;
  const clickRate = campaign.sent_count > 0 ? Math.round((campaign.click_count / campaign.sent_count) * 100) : 0;
  const clickToOpenRate = campaign.open_count > 0 ? Math.round((campaign.click_count / campaign.open_count) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-2xl font-bold text-gray-900">{campaign.subject}</h1>
            <Badge variant={campaign.status === "sent" ? "success" : campaign.status === "draft" ? "default" : "info"}>
              {campaign.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            {campaign.sent_at
              ? `Envoyé le ${new Date(campaign.sent_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
              : `Créé le ${new Date(campaign.created_at).toLocaleDateString("fr-FR")}`}
            {campaign.target_tag && <span className="ml-2">- Cible : {campaign.target_tag}</span>}
          </p>
        </div>
        <Button variant="ghost" size="sm" href="/admin/emails">
          ← Retour
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900">{campaign.sent_count}</p>
          <p className="text-xs text-gray-500 mt-1">Envoyés</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-es-green">{campaign.open_count}</p>
          <p className="text-xs text-gray-500 mt-1">Ouverts ({openRate}%)</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-es-green h-1.5 rounded-full transition-all" style={{ width: `${openRate}%` }} />
          </div>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-blue-600">{campaign.click_count}</p>
          <p className="text-xs text-gray-500 mt-1">Clics ({clickRate}%)</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${clickRate}%` }} />
          </div>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-purple-600">{clickToOpenRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Clic/Ouverture</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-amber-600">{linkStats.length}</p>
          <p className="text-xs text-gray-500 mt-1">Liens trackés</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { key: "overview" as const, label: "Vue d'ensemble" },
          { key: "recipients" as const, label: "Destinataires" },
          { key: "links" as const, label: "Clics par lien" },
          { key: "clickers" as const, label: "Qui a cliqué" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <Card>
          <h3 className="font-medium text-gray-900 mb-4">Aperçu de l'email</h3>
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="bg-es-green text-white p-4 rounded-t-lg text-center mb-4">
              <p className="font-serif font-bold">Emeline Siron</p>
            </div>
            <div
              className="text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: campaign.html_content }}
            />
          </div>
        </Card>
      )}

      {activeTab === "recipients" && (
        <div>
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => exportRecipients()}>Exporter tous</Button>
            <Button variant="ghost" size="sm" onClick={() => exportRecipients("opened")}>Exporter ouverts</Button>
            <Button variant="ghost" size="sm" onClick={() => exportRecipients("clicked")}>Exporter cliqués</Button>
          </div>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Envoyé</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Ouvert</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Cliqué</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sends.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">Aucun envoi</td></tr>
                  ) : (
                    sends.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm text-gray-900">{s.contact.email}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{s.contact.first_name} {s.contact.last_name}</td>
                        <td className="px-5 py-3">
                          <Badge variant={s.status === "sent" ? "success" : "error"}>
                            {s.status === "sent" ? "Oui" : "Erreur"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          {s.opened_at ? (
                            <span className="text-xs text-green-600">{new Date(s.opened_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {s.clicked_at ? (
                            <span className="text-xs text-blue-600">{new Date(s.clicked_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "links" && (
        <div className="space-y-4">
          {linkStats.length === 0 ? (
            <Card>
              <p className="text-sm text-gray-400 text-center py-8">Aucun clic enregistré sur les liens</p>
            </Card>
          ) : (
            linkStats.map((link) => (
              <Card key={link.url}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{link.url}</p>
                    <p className="text-xs text-gray-500 mt-1">{link.clicks} clic(s) — {link.clickers.length} personne(s)</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{link.clicks}</p>
                      <p className="text-xs text-gray-400">clics</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLink(selectedLink === link.url ? null : link.url)}
                      >
                        {selectedLink === link.url ? "Masquer" : "Voir qui"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => exportLinkClickers(link.url)}>
                        Export
                      </Button>
                    </div>
                  </div>
                </div>

                {selectedLink === link.url && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2 text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="pb-2 text-xs font-medium text-gray-500 uppercase">Nom</th>
                          <th className="pb-2 text-xs font-medium text-gray-500 uppercase">Date du clic</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {link.clickers.map((c, i) => (
                          <tr key={i}>
                            <td className="py-2 text-sm text-gray-900">{c.email}</td>
                            <td className="py-2 text-sm text-gray-600">{c.name}</td>
                            <td className="py-2 text-xs text-gray-400">{new Date(c.clicked_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "clickers" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button variant="ghost" size="sm" onClick={() => exportRecipients("clicked")}>
              Exporter les cliqueurs
            </Button>
          </div>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date du clic</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Liens cliqués</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sends.filter((s) => s.clicked_at).length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">Personne n'a encore cliqué</td></tr>
                  ) : (
                    sends
                      .filter((s) => s.clicked_at)
                      .sort((a, b) => new Date(b.clicked_at!).getTime() - new Date(a.clicked_at!).getTime())
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-sm text-gray-900 font-medium">{s.contact.email}</td>
                          <td className="px-5 py-3 text-sm text-gray-600">{s.contact.first_name} {s.contact.last_name}</td>
                          <td className="px-5 py-3 text-xs text-gray-500">
                            {new Date(s.clicked_at!).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-col gap-1">
                              {(s.clicked_links || []).map((link, i) => (
                                <span key={i} className="text-xs text-blue-600 truncate max-w-xs block">{link}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
