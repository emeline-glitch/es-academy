"use client";

import { useState } from "react";
import { trackEvent, ConversionEvents } from "@/lib/analytics/gtm";

type Plan = "1x" | "3x" | "4x";

const PLANS: Array<{ id: Plan; label: string; sublabel: string }> = [
  { id: "1x", label: "998€ en 1 fois", sublabel: "Paiement unique" },
  { id: "3x", label: "3 x 332,67€", sublabel: "En 3 mensualités" },
  { id: "4x", label: "4 x 249,50€", sublabel: "En 4 mensualités" },
];

const PLAN_VALUE: Record<Plan, number> = { "1x": 998, "3x": 998, "4x": 998 };

export function AcademyCheckoutButtons() {
  const [selected, setSelected] = useState<Plan>("1x");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    trackEvent(ConversionEvents.CTA_ACADEMY, {
      plan: selected,
      value: PLAN_VALUE[selected],
      currency: "EUR",
    });
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Impossible de créer la session de paiement");
        setLoading(false);
        return;
      }
      trackEvent(ConversionEvents.CHECKOUT_INITIATED, {
        plan: selected,
        value: PLAN_VALUE[selected],
        currency: "EUR",
        product: "academy",
      });
      window.location.href = data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur réseau";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {PLANS.map((plan) => {
          const isActive = selected === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelected(plan.id)}
              aria-pressed={isActive}
              className={[
                "rounded-xl border-2 px-4 py-4 text-left transition",
                isActive
                  ? "border-es-gold bg-es-gold/15 ring-2 ring-es-gold/40"
                  : "border-es-cream/25 bg-es-cream/[0.04] hover:border-es-cream/40",
              ].join(" ")}
            >
              <div className="text-es-cream font-semibold text-base">
                {plan.label}
              </div>
              <div className="text-es-cream/60 text-xs mt-1">
                {plan.sublabel}
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="w-full sm:w-auto sm:px-12 btn-gold-shimmer rounded-lg bg-es-gold px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-es-gold-dark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Redirection..." : "Je rejoins la formation →"}
      </button>

      {error && (
        <p className="mt-3 text-sm text-es-terracotta-light" role="alert">
          {error}
        </p>
      )}

      <p className="text-sm text-es-cream/70 mt-4">
        Paiement sécurisé · Accès immédiat · Satisfait ou remboursé 14 jours
      </p>
      <p className="text-[11px] text-es-cream/40 mt-6 max-w-xl mx-auto leading-relaxed">
        À l&apos;issue des 3 mois, l&apos;accès ES Family se poursuit automatiquement à 29€/mois, sans engagement, annulable en 1 clic.
      </p>
    </div>
  );
}
