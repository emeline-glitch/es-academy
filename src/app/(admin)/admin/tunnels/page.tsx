import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/utils/format";

interface TunnelStep {
  name: string;
  url: string;
  type: string;
}
interface Tunnel {
  name: string;
  captureTag?: string;
  productName?: string;
  steps: TunnelStep[];
}

const tunnels: Tunnel[] = [
  {
    name: "Tunnel Outils Gratuits",
    captureTag: "outils_gratuits",
    steps: [
      { name: "Page capture", url: "/outils-gratuits", type: "capture" },
      { name: "Page merci + Upsell", url: "/merci-outils", type: "upsell" },
      { name: "Séquence email nurturing", url: "/admin/sequences", type: "email" },
    ],
  },
  {
    name: "Tunnel ES Academy",
    captureTag: "client",
    productName: "academy",
    steps: [
      { name: "Page de vente", url: "/academy", type: "vente" },
      { name: "Checkout Stripe", url: "#", type: "paiement" },
      { name: "Page merci", url: "/merci", type: "confirmation" },
      { name: "Séquence bienvenue", url: "/admin/sequences", type: "email" },
    ],
  },
  {
    name: "Tunnel ES Family",
    productName: "family",
    steps: [
      { name: "Page de vente", url: "/family", type: "vente" },
      { name: "Checkout Stripe", url: "/api/stripe/checkout-family?plan=fondateur", type: "paiement" },
    ],
  },
];

const stepIcons: Record<string, string> = {
  capture: "📥",
  vente: "🛒",
  paiement: "💳",
  confirmation: "✅",
  upsell: "⬆️",
  email: "📧",
};

interface TunnelsStats {
  captures_by_tag: Record<string, number>;
  sales_by_product: Record<string, { count: number; revenue: number }>;
}

export default async function AdminTunnels() {
  const supabase = await createClient();

  // 1 seul RPC qui agrège captures par tag + ventes/revenu par produit (migration 017)
  const { data } = await supabase.rpc("tunnels_stats");
  const stats: TunnelsStats = (data as TunnelsStats) || { captures_by_tag: {}, sales_by_product: {} };
  const captureCounts = stats.captures_by_tag || {};
  const productRevenue = stats.sales_by_product || {};

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Tunnels de vente</h1>
        <p className="text-sm text-gray-500 mt-1">Tes parcours de conversion, avec les chiffres réels.</p>
      </div>

      <div className="space-y-6">
        {tunnels.map((tunnel, i) => {
          const captures = tunnel.captureTag ? captureCounts[tunnel.captureTag] || 0 : 0;
          const sales = tunnel.productName ? productRevenue[tunnel.productName]?.count || 0 : 0;
          const revenue = tunnel.productName ? productRevenue[tunnel.productName]?.revenue || 0 : 0;
          const convRate = captures > 0 ? Math.round((sales / captures) * 100) : 0;

          return (
            <Card key={i}>
              <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h2 className="font-serif text-lg font-bold text-gray-900">{tunnel.name}</h2>
                </div>
                <Badge variant="success">Actif</Badge>
              </div>

              {/* KPIs du tunnel */}
              {(tunnel.captureTag || tunnel.productName) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {tunnel.captureTag && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-[10px] uppercase text-blue-700 font-semibold tracking-wider">Captures</p>
                      <p className="text-xl font-bold text-blue-700 mt-1">{captures}</p>
                    </div>
                  )}
                  {tunnel.productName && (
                    <>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-[10px] uppercase text-green-700 font-semibold tracking-wider">Ventes</p>
                        <p className="text-xl font-bold text-green-700 mt-1">{sales}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-[10px] uppercase text-amber-700 font-semibold tracking-wider">Revenu</p>
                        <p className="text-xl font-bold text-amber-700 mt-1">{formatMoney(revenue)}</p>
                      </div>
                      {tunnel.captureTag && (
                        <div className="bg-es-green/10 rounded-lg p-3">
                          <p className="text-[10px] uppercase text-es-green font-semibold tracking-wider">Conversion</p>
                          <p className="text-xl font-bold text-es-green mt-1">{convRate}%</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Steps */}
              <div className="flex flex-wrap items-center gap-2">
                {tunnel.steps.map((step, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <a
                      href={step.url}
                      target={step.url.startsWith("http") ? "_blank" : undefined}
                      rel={step.url.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-es-green/5 transition-colors group"
                    >
                      <span>{stepIcons[step.type] || "📄"}</span>
                      <span className="text-sm text-gray-700 group-hover:text-es-green">{step.name}</span>
                    </a>
                    {j < tunnel.steps.length - 1 && (
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Landing pages */}
      <div className="mt-12">
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">Pages du site</h2>
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Page</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">URL</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { name: "Accueil", url: "/", type: "Hub" },
                  { name: "ES Academy", url: "/academy", type: "Vente" },
                  { name: "ES Family", url: "/family", type: "Vente" },
                  { name: "Outils Gratuits", url: "/outils-gratuits", type: "Capture" },
                  { name: "Merci Outils", url: "/merci-outils", type: "Upsell" },
                  { name: "Merci Achat", url: "/merci", type: "Confirmation" },
                  { name: "Blog", url: "/blog", type: "SEO" },
                  { name: "Qui est Emeline ?", url: "/a-propos", type: "Branding" },
                ].map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-500 font-mono">{p.url}</td>
                    <td className="px-5 py-3"><Badge>{p.type}</Badge></td>
                    <td className="px-5 py-3">
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm text-es-green hover:underline">Voir →</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}
