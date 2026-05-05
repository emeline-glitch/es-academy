"use client";

import Script from "next/script";

/**
 * Google Analytics 4 via gtag.js direct.
 *
 * Branche GA4 immediatement sans dependre de la config GTM (pratique
 * quand l'admin GTM n'a pas encore configure le tag GA4 cote interface).
 *
 * Cohabite avec GTM : window.dataLayer et window.gtag sont partages.
 * Les events 'cta_academy_click', 'purchase' etc. sont envoyes via
 * trackEvent() qui appelle gtag('event', ...) directement → GA4 reçoit.
 *
 * Le Consent Mode v2 est deja initialise par GoogleTagManager.tsx
 * (default denied), pas besoin de re-init ici.
 *
 * Important : ne PAS configurer GA4 dans GTM aussi, sinon double envoi
 * (un via gtag direct, un via le tag GTM). Garde ce GA4 en code, et utilise
 * GTM uniquement pour Meta Pixel, Google Ads conversion, LinkedIn Insight.
 *
 * send_page_view: false : on desactive le auto-pageview de gtag pour
 * eviter le doublon avec GtmPageViewTracker (qui push 'page_view' a chaque
 * changement de route SPA Next App Router). On gere les pageviews
 * uniformement via dataLayer.push.
 */

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            if (typeof window.gtag !== 'function') {
              window.gtag = function() { window.dataLayer.push(arguments); };
            }
            window.gtag('js', new Date());
            window.gtag('config', '${measurementId}', {
              send_page_view: false,
              anonymize_ip: true
            });
          `,
        }}
      />
    </>
  );
}
