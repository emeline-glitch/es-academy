"use client";

import { useState } from "react";

interface Props {
  status: "past_due" | "unpaid";
  /** ISO date string : fin de la période actuellement payée. Affichée dans le wording. */
  currentPeriodEnd: string | null;
}

/**
 * Bandeau warning affiché en haut du layout (platform) quand l'user a un
 * abonnement Family en échec de paiement.
 *
 * UX delibérée : on ne bloque PAS l'accès. L'objectif est qu'il agisse en
 * cliquant le bouton vers le Customer Portal Stripe pour mettre à jour sa
 * carte. Si on bloque, statistiquement on perd le client.
 */
export function PastDueBanner({ status, currentPeriodEnd }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Date d'expiration formatée FR (sans année si <12 mois pour rester court).
  const dateButoir = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
      })
    : null;

  const isUnpaid = status === "unpaid";

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Impossible d'ouvrir le portail.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Erreur réseau. Réessaye.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-amber-900 font-semibold">
            {isUnpaid
              ? "⚠️ Ton abonnement Family est en échec de paiement"
              : "⚠️ Le dernier prélèvement Family n'a pas pu passer"}
          </p>
          <p className="text-xs text-amber-800 mt-0.5">
            {isUnpaid
              ? "Mets à jour ta carte rapidement pour ne pas perdre l'accès à Family."
              : dateButoir
                ? `Mets à jour ta carte avant le ${dateButoir} pour ne pas perdre l'accès.`
                : "Mets à jour ta carte pour conserver ton abonnement."}
          </p>
          {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
        </div>
        <button
          onClick={handleClick}
          disabled={loading}
          className="flex-shrink-0 inline-block bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold text-sm transition whitespace-nowrap"
        >
          {loading ? "Ouverture..." : "Mettre à jour ma carte"}
        </button>
      </div>
    </div>
  );
}
