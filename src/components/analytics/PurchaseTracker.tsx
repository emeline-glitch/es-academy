"use client";

import { useEffect, useRef } from "react";
import { trackEvent, ConversionEvents } from "@/lib/analytics/gtm";

interface PurchaseTrackerProps {
  product: "academy" | "family" | "coaching" | "leadmagnet";
  value?: number;        // montant en EUR (998 pour Academy 1x, 19 pour Family fondateur)
  currency?: string;     // par defaut EUR
  transactionId?: string; // session_id Stripe si dispo
  plan?: string;         // ex: "1x", "3x", "4x", "fondateur", "standard"
}

/**
 * Component a placer sur les pages /merci, /family/bienvenue, etc.
 *
 * Push un event 'purchase' GA4 standard avec value/currency/transaction_id,
 * permet de tracker les conversions dans GA4 + Google Ads + Meta Ads.
 *
 * Garde anti-duplicate : ne fire qu'une fois par session pour un meme transactionId.
 */
export function PurchaseTracker({
  product,
  value,
  currency = "EUR",
  transactionId,
  plan,
}: PurchaseTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    // Anti-duplicate via sessionStorage si transactionId disponible
    if (transactionId) {
      const key = `__purchase_${transactionId}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {
        // sessionStorage indispo, on fire quand meme
      }
    }
    fired.current = true;

    trackEvent(ConversionEvents.PURCHASE_COMPLETED, {
      product,
      ...(value !== undefined ? { value } : {}),
      currency,
      ...(transactionId ? { transaction_id: transactionId } : {}),
      ...(plan ? { plan } : {}),
      // Format GA4 ecommerce minimal
      items: [
        {
          item_name: product,
          item_category: product,
          ...(plan ? { item_variant: plan } : {}),
          ...(value !== undefined ? { price: value } : {}),
          quantity: 1,
        },
      ],
    });
  }, [product, value, currency, transactionId, plan]);

  return null;
}
