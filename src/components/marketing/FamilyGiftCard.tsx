"use client";

import { useState } from "react";

interface Props {
  code: string;
  activationUrl: string;
}

export function FamilyGiftCard({ code, activationUrl }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API non dispo (HTTP, vieux navigateur) : fallback select-all input.
      const input = document.getElementById("gift-code-input") as HTMLInputElement | null;
      if (input) {
        input.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }

  return (
    <div className="bg-gradient-to-br from-es-green/5 to-es-gold/5 rounded-2xl p-6 sm:p-8 border-2 border-es-gold/30 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🎁</span>
        <h2 className="font-serif text-lg sm:text-xl font-bold text-es-text">
          Ton code cadeau ES Family
        </h2>
      </div>
      <p className="text-sm text-es-text-muted mb-5">
        3 mois offerts dans la communauté privée. Code à utiliser sur la page d&apos;activation.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <input
          id="gift-code-input"
          type="text"
          value={code}
          readOnly
          className="flex-1 font-mono text-base sm:text-lg font-bold text-es-green bg-white border border-es-cream-dark rounded-xl px-4 py-3 tracking-wider text-center sm:text-left"
          onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
        />
        <button
          type="button"
          onClick={handleCopy}
          className="h-12 px-5 bg-es-green text-white font-medium rounded-xl hover:bg-es-green-dark transition-colors text-sm whitespace-nowrap"
        >
          {copied ? "✓ Copié" : "Copier"}
        </button>
      </div>

      <a
        href={activationUrl}
        className="inline-flex items-center justify-center w-full h-12 bg-es-gold text-white font-semibold rounded-xl hover:bg-es-gold-dark transition-colors text-sm"
      >
        Activer mes 3 mois ES Family →
      </a>
    </div>
  );
}
