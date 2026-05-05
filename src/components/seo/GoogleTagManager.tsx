"use client";

import Script from "next/script";

/**
 * Google Tag Manager avec Consent Mode v2 (RGPD compliant).
 *
 * Strategy :
 *  - Default consent : tout en "denied" (aucun cookie tiers depose avant accord)
 *  - Si l'user a deja accepte (localStorage), on update direct au boot
 *  - Sinon, le composant CookieConsent push 'consent_update' dans dataLayer
 *    quand l'user clique Accepter
 *
 * Le script GTM lui-meme charge tous les autres tags configures dans GTM
 * (GA4, Meta Pixel, LinkedIn Insight, Google Ads conversions...).
 */

export function GoogleTagManagerHead({ gtmId }: { gtmId: string }) {
  return (
    <>
      <Script
        id="gtm-consent-default"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              functionality_storage: 'granted',
              security_storage: 'granted',
              wait_for_update: 500
            });
            try {
              if (localStorage.getItem('cookie_consent') === 'accepted') {
                gtag('consent', 'update', {
                  ad_storage: 'granted',
                  ad_user_data: 'granted',
                  ad_personalization: 'granted',
                  analytics_storage: 'granted'
                });
              }
            } catch (e) {}
          `,
        }}
      />
      <Script
        id="gtm-loader"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');`,
        }}
      />
    </>
  );
}

export function GoogleTagManagerNoScript({ gtmId }: { gtmId: string }) {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
