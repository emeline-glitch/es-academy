"use client";

import { useEffect } from "react";
import { trackCta } from "@/lib/cta-tracking";

/**
 * Listener global qui delegue le tracking CTA. Monte une seule fois dans
 * le root layout. Capte les clics sur tout element avec data-cta="xxx",
 * y compris a l'interieur de <a> ou <button>.
 *
 * Pourquoi capture phase : on tracke AVANT que d'autres handlers (Link
 * Next.js, navigation) interceptent l'event. fetch keepalive garantit que
 * l'envoi va jusqu'au bout meme si la page change.
 */
export function CtaTrackerProvider() {
  useEffect(() => {
    function handler(e: MouseEvent) {
      const path = e.composedPath ? e.composedPath() : [];
      let el: Element | null = null;
      for (const node of path) {
        if (node instanceof Element && node.hasAttribute && node.hasAttribute("data-cta")) {
          el = node;
          break;
        }
      }
      if (!el) {
        const tgt = e.target;
        el = tgt instanceof Element ? (tgt.closest("[data-cta]") as Element | null) : null;
      }
      if (!el) return;
      const id = el.getAttribute("data-cta");
      if (id) trackCta(id);
    }
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, []);
  return null;
}
