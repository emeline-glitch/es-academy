"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/gtm";

interface TrackedLinkProps {
  href: string;
  event: string;
  eventParams?: Record<string, unknown>;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  /** Si true, utilise <a> classique (force navigation full page, ex: vers /api/...) */
  external?: boolean;
}

/**
 * Wrapper de <a> ou <Link> qui push un event GTM avant la navigation.
 *
 * Pour les CTAs de checkout (window.location vers Stripe), utilise external=true
 * pour que le href fasse une vraie navigation HTTP.
 */
export function TrackedLink({
  href,
  event,
  eventParams = {},
  children,
  className,
  target,
  rel,
  external = false,
}: TrackedLinkProps) {
  function handleClick() {
    trackEvent(event, eventParams);
    // On laisse le navigateur faire la navigation, pas de preventDefault
  }

  if (external || href.startsWith("/api/") || href.startsWith("http")) {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={className}
        target={target}
        rel={rel}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
