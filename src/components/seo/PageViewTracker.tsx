"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { captureAttribution } from "@/lib/analytics/utm";

const SKIP_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/cours",
  "/connexion",
  "/inscription",
  "/site-password",
];

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem("__es_sid");
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("__es_sid", id);
    }
    return id;
  } catch {
    return "";
  }
}

export function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname === lastPath.current) return;
    if (SKIP_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return;
    lastPath.current = pathname;

    const referrer = document.referrer || null;
    const attribution = captureAttribution();

    fetch("/api/track/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer,
        session_id: getOrCreateSessionId(),
        ...attribution,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
