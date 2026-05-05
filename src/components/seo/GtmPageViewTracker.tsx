"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackPageView } from "@/lib/analytics/gtm";

/**
 * Push un event 'page_view' dans dataLayer a chaque changement de route.
 *
 * En mode App Router Next.js, le SPA-like navigation ne declenche pas
 * automatiquement gtm.js sur les nouvelles pages. Il faut donc tracker
 * manuellement les changements via usePathname.
 */

const SKIP_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/cours",
  "/connexion",
  "/inscription",
  "/site-password",
];

export function GtmPageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname === lastPath.current) return;
    if (SKIP_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return;
    lastPath.current = pathname;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
