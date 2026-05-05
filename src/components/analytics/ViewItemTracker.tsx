"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/gtm";

interface ViewItemTrackerProps {
  itemId: string;
  itemName: string;
  itemCategory: string;
  value: number;
  currency?: string;
}

/**
 * Push un event GA4 'view_item' au mount d'une page produit (Enhanced
 * ecommerce). Permet de constituer des audiences de remarketing dans
 * Google Ads et Meta Ads ("users qui ont vu /academy mais pas achete").
 */
export function ViewItemTracker({
  itemId,
  itemName,
  itemCategory,
  value,
  currency = "EUR",
}: ViewItemTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent("view_item", {
      currency,
      value,
      items: [
        {
          item_id: itemId,
          item_name: itemName,
          item_category: itemCategory,
          price: value,
          quantity: 1,
        },
      ],
    });
  }, [itemId, itemName, itemCategory, value, currency]);

  return null;
}
