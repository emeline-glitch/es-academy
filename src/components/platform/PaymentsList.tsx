"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { PaymentSummary } from "@/lib/platform/profile";

interface Props {
  payments: PaymentSummary[];
}

const statusLabels: Record<string, string> = {
  active: "Actif",
  past_due: "Paiement en échec",
  unpaid: "Impaye",
  canceled: "Annulé",
  cancelled: "Annulé",
  trialing: "Periode d'essai",
};

const statusClasses: Record<string, string> = {
  active: "bg-es-green/10 text-es-green",
  past_due: "bg-amber-50 text-amber-700",
  unpaid: "bg-red-50 text-red-700",
  canceled: "bg-gray-100 text-gray-500",
  cancelled: "bg-gray-100 text-gray-500",
  trialing: "bg-blue-50 text-blue-700",
};

export function PaymentsList({ payments }: Props) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  async function openPortal() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setPortalError(data.error || "Impossible d'ouvrir le portail.");
        setPortalLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setPortalError("Erreur reseau. Réessaie.");
      setPortalLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-1">Paiements et abonnements</h2>
          <p className="text-sm text-gray-500">Factures, carte, abonnement Family : tout passe par le portail Stripe.</p>
        </div>
        <button
          type="button"
          onClick={openPortal}
          disabled={portalLoading}
          className="shrink-0 inline-flex items-center px-4 py-2 bg-es-green text-white rounded-lg text-sm font-semibold hover:bg-es-green-light transition-colors disabled:opacity-60 cursor-pointer"
        >
          {portalLoading ? "Ouverture..." : "Ouvrir le portail Stripe"}
        </button>
      </div>

      {portalError && <p className="text-xs text-red-700 mb-3">{portalError}</p>}

      {payments.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aucun paiement enregistre pour l&apos;instant. Si tu viens d&apos;achetér, attends quelques minutes.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {payments.map((p) => (
            <li key={p.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.productName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {p.kind === "academy" ? "Formation" : "Abonnément"}
                  {p.purchasedAt && (
                    <>
                      <span className="text-gray-300"> · </span>
                      {formatDate(p.purchasedAt)}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {p.amount > 0 && (
                  <span className="text-sm text-gray-700 font-medium">{formatEuro(p.amount)}</span>
                )}
                <span
                  className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    statusClasses[p.status] || statusClasses.canceled
                  }`}
                >
                  {statusLabels[p.status] || p.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}
