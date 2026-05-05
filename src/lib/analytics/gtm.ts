/**
 * Helpers GTM/dataLayer pour tracker les conversions cote client.
 *
 * Usage typique :
 *   import { trackEvent } from "@/lib/analytics/gtm";
 *   trackEvent("cta_academy_click", { plan: "academy", price: 998 });
 *
 * Les events sont pousses dans window.dataLayer ; GTM les recoit et peut
 * les router vers GA4, Meta Pixel, Google Ads conversions, etc.
 *
 * Si GTM n'est pas configure (NEXT_PUBLIC_GTM_ID absent), les push sont
 * silencieux (no-op via la garde sur dataLayer).
 */

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  if (!window.dataLayer) return;
  window.dataLayer.push({ event: name, ...params });
}

export function trackPageView(path: string): void {
  trackEvent("page_view", { page_path: path });
}

export function updateAnalyticsConsent(granted: boolean): void {
  if (typeof window === "undefined" || !window.gtag) return;
  const state = granted ? "granted" : "denied";
  window.gtag("consent", "update", {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  });
}

// Events de conversion (centralise les noms pour eviter les typos a l'usage)
export const ConversionEvents = {
  CTA_ACADEMY: "cta_academy_click",
  CTA_FAMILY: "cta_family_click",
  CTA_COACHING: "cta_coaching_click",
  LEAD_MAGNET_OPTIN: "lead_magnet_optin",
  NEWSLETTER_SUBSCRIBE: "newsletter_subscribe",
  CHECKOUT_INITIATED: "begin_checkout",
  PURCHASE_COMPLETED: "purchase",
  SIMULATEUR_USED: "simulateur_used",
} as const;
