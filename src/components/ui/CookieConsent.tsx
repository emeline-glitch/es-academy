"use client";

import { useState, useEffect } from "react";
import { updateAnalyticsConsent } from "@/lib/analytics/gtm";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Delay to avoid layout shift
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "accepted");
    updateAnalyticsConsent(true);
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("cookie_consent", "declined");
    updateAnalyticsConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 bg-white rounded-xl shadow-2xl border border-es-cream-dark p-5 animate-[fadeInUp_0.4s_ease-out]">
      <p className="text-sm text-es-text mb-1 font-medium">Cookies</p>
      <p className="text-xs text-es-text-muted mb-4 leading-relaxed">
        Ce site utilise des cookies essentiels au fonctionnement. Les cookies analytiques ne sont déposés qu&apos;avec ton accord.{" "}
        <a href="/politique-confidentialite" className="text-es-green underline">En savoir plus</a>
      </p>
      <div className="flex gap-2">
        <button
          onClick={decline}
          className="flex-1 px-3 py-2 text-xs font-medium text-es-text-muted border border-es-cream-dark rounded-lg hover:bg-es-cream transition-colors cursor-pointer"
        >
          Refuser
        </button>
        <button
          onClick={accept}
          className="flex-1 px-3 py-2 text-xs font-medium text-white bg-es-green rounded-lg hover:bg-es-green-light transition-colors cursor-pointer"
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
