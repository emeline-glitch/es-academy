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
          {payments.map((p) => {
            const status = p.stripeStatus || p.status;
            const installments = p.installments || 1;
            const isMulti = installments > 1;
            const remaining = isMulti ? installments - p.paidCount : 0;
            return (
              <li key={p.id} className="py-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
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
                        statusClasses[status] || statusClasses.canceled
                      }`}
                    >
                      {statusLabels[status] || status}
                    </span>
                  </div>
                </div>

                {/* Detail Stripe : mensualites + prochaine echeance */}
                {p.stripeSubscriptionId && (
                  <div className="bg-gray-50 rounded-md p-3 text-xs space-y-1">
                    {isMulti && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Paiement en {installments} fois</span>
                        <span className="font-semibold text-gray-900">
                          {p.paidCount} / {installments} payee{p.paidCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    {p.currentPeriodEnd && status !== "canceled" && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">
                          {isMulti && remaining > 0 ? "Prochaine mensualite" : "Prochaine echeance"}
                        </span>
                        <span className="font-semibold text-gray-900">{formatDate(p.currentPeriodEnd)}</span>
                      </div>
                    )}
                    {p.cancelAtPeriodEnd && (
                      <p className="text-amber-700">Resiliation programmee a la fin de la periode.</p>
                    )}
                  </div>
                )}

                {/* Factures Stripe : telechargement PDF direct */}
                {p.invoices.length > 0 && (
                  <details className="text-xs">
                    <summary className="font-semibold text-gray-700 cursor-pointer hover:text-es-green">
                      Mes factures ({p.invoices.length})
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                      {p.invoices.map((inv) => (
                        <li key={inv.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-gray-700 truncate">{inv.number || inv.id}</p>
                            <p className="text-[10px] text-gray-400">{formatDate(inv.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold text-gray-900">{formatEuro(inv.amountCents / 100)}</span>
                            <span
                              className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                inv.paid ? "bg-es-green/10 text-es-green" : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {inv.paid ? "Payee" : inv.status || "en attente"}
                            </span>
                            {inv.invoicePdf && (
                              <a
                                href={inv.invoicePdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-es-green hover:underline font-semibold"
                              >
                                PDF
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
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
