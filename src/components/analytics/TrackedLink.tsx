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
  /** ID CTA pour l'attribution (data-cta="..." sur le DOM final). */
  "data-cta"?: string;
}

/**
 * Wrapper de <a> ou <Link> qui push un event GTM avant la navigation.
 *
 * Pour les CTAs de checkout (window.location vers Stripe), utilise external=true
 * pour que le href fasse une vraie navigation HTTP.
 *
 * data-cta est forwarded au DOM pour permettre l'attribution cote dashboard
 * "Top CTA convertisseurs" (RPC cta_attribution). Sans ce forward, les
 * clics ne sont pas captures meme si on l'ecrit dans le JSX.
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
  "data-cta": dataCta,
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
        data-cta={dataCta}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={handleClick} className={className} data-cta={dataCta}>
      {children}
    </Link>
  );
}
