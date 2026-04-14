"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const tunnels = [
  {
    name: "Tunnel Outils Gratuits",
    status: "active",
    steps: [
      { name: "Page capture", url: "/outils-gratuits", type: "capture" },
      { name: "Page merci + Upsell", url: "/merci-outils", type: "upsell" },
      { name: "Séquence email nurturing", url: "#", type: "email" },
    ],
    conversions: "—",
  },
  {
    name: "Tunnel ES Academy",
    status: "active",
    steps: [
      { name: "Page de vente", url: "/academy", type: "vente" },
      { name: "Checkout Stripe", url: "#", type: "paiement" },
      { name: "Page merci", url: "/merci", type: "confirmation" },
      { name: "Séquence bienvenue", url: "#", type: "email" },
    ],
    conversions: "—",
  },
  {
    name: "Tunnel ES Family",
    status: "active",
    steps: [
      { name: "Page de vente", url: "/family", type: "vente" },
      { name: "Checkout Skool", url: "https://www.skool.com/es-family", type: "paiement" },
    ],
    conversions: "—",
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

export default function AdminTunnels() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Tunnels de vente</h1>
          <p className="text-sm text-gray-500 mt-1">Vos parcours de conversion</p>
        </div>
      </div>

      <div className="space-y-6">
        {tunnels.map((tunnel, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-gray-900">{tunnel.name}</h2>
              </div>
              <Badge variant={tunnel.status === "active" ? "success" : "default"}>
                {tunnel.status}
              </Badge>
            </div>

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
        ))}
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
                  { name: "À propos", url: "/a-propos", type: "Branding" },
                ].map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-500 font-mono">{p.url}</td>
                    <td className="px-5 py-3"><Badge>{p.type}</Badge></td>
                    <td className="px-5 py-3">
                      <a href={p.url} target="_blank" className="text-sm text-es-green hover:underline">Voir →</a>
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
