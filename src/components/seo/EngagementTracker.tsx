"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/gtm";

const SCROLL_THRESHOLDS = [25, 50, 75, 100];

const SKIP_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/cours",
  "/connexion",
  "/inscription",
  "/site-password",
];

const EXTERNAL_DOMAINS_TO_TRACK = [
  "instagram.com",
  "linkedin.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "trustpilot.com",
  "ausha.co",
  "spotify.com",
  "apple.com/podcasts",
  "podcasts.apple.com",
  "calendly.com",
  "esfamily.fr",
  "solstice-patrimoine.fr",
  "otb-podcast.fr",
];

/**
 * EngagementTracker : track les signaux d'engagement (scroll deep, external
 * link clicks, time-on-page) qui informent les algos d'attribution Google
 * Ads et Meta Ads ("ce visiteur est qualitatif").
 *
 * - scroll_25/50/75/100 : push une seule fois par pathname (anti-spam)
 * - external_link_click : si href pointe vers un domaine externe whitelist
 * - time_on_page : push a 30s, 60s, 180s
 */
export function EngagementTracker() {
  const pathname = usePathname();
  const firedScroll = useRef<Set<number>>(new Set());
  const firedTime = useRef<Set<number>>(new Set());
  const lastPath = useRef<string | null>(null);
  const startTs = useRef<number>(Date.now());

  useEffect(() => {
    if (!pathname) return;
    if (SKIP_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return;

    // Reset thresholds quand on change de page
    if (pathname !== lastPath.current) {
      firedScroll.current = new Set();
      firedTime.current = new Set();
      startTs.current = Date.now();
      lastPath.current = pathname;
    }

    function getScrollPercent(): number {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      if (total <= 0) return 100;
      return Math.round(((window.scrollY || doc.scrollTop) / total) * 100);
    }

    function onScroll() {
      const pct = getScrollPercent();
      for (const t of SCROLL_THRESHOLDS) {
        if (pct >= t && !firedScroll.current.has(t)) {
          firedScroll.current.add(t);
          trackEvent("scroll", { percent_scrolled: t, page_path: pathname });
        }
      }
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest("a") as HTMLAnchorElement | null;
      if (!link?.href) return;
      try {
        const url = new URL(link.href);
        if (url.origin === window.location.origin) return; // interne, deja tracke par page_view
        const matchedDomain = EXTERNAL_DOMAINS_TO_TRACK.find((d) => url.hostname.includes(d));
        if (!matchedDomain) return;
        trackEvent("external_link_click", {
          link_url: link.href,
          link_domain: url.hostname,
          link_text: (link.textContent || "").slice(0, 100).trim(),
          source_path: pathname,
        });
      } catch {
        // pas une URL valide
      }
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (const sec of [30, 60, 180]) {
      timeouts.push(
        setTimeout(() => {
          if (!firedTime.current.has(sec)) {
            firedTime.current.add(sec);
            trackEvent("time_on_page", { seconds: sec, page_path: pathname });
          }
        }, sec * 1000)
      );
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      for (const t of timeouts) clearTimeout(t);
    };
  }, [pathname]);

  return null;
}
