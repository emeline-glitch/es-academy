"use client";

import { useState } from "react";

interface PromoBannerProps {
  text: string;
  ctaText?: string;
  ctaHref?: string;
  variant?: "green" | "terracotta" | "gold";
}

export function PromoBanner({
  text,
  ctaText,
  ctaHref = "/academy",
  variant = "green",
}: PromoBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const bgClass = {
    green: "bg-es-green",
    terracotta: "bg-es-terracotta",
    gold: "bg-es-gold",
  }[variant];

  return (
    <div className={`${bgClass} text-white py-2.5 px-4 text-center text-sm relative`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <span>{text}</span>
        {ctaText && (
          <a
            href={ctaHref}
            className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium transition-colors"
          >
            {ctaText} →
          </a>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
