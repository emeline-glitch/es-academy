"use client";

import { useEffect, useState, useCallback } from "react";
import { trackEvent } from "@/lib/analytics/gtm";

/**
 * Popup exit-intent : capture l'email d'un visiteur qui s'apprete a
 * quitter la page (mouvement souris vers le haut du viewport).
 *
 * Regles UX :
 * - Ne fire pas avant 5 secondes sur la page (sinon ressenti spam)
 * - Une seule fois par navigation (sessionStorage)
 * - Une seule fois par mois (cookie es-exit-shown 30j)
 * - Skip mobile (pas de souris ; pas d'equivalent fiable sans casser l'UX)
 * - Le visiteur peut fermer (X) sans email → on respecte
 * - Si l'utilisateur est deja taggue lm:exit-intent, on skip (deja capture)
 *
 * Apres opt-in : tag lm:exit-intent + redirection /merci-outils (page
 * existante qui delivre les outils gratuits).
 */
export function ExitIntentPopup({
  // Texte personnalisable selon la page (academy vs family)
  bait = "Avant de partir, recevoir mon guide gratuit ?",
  subBait = "10 outils pour cadrer ton premier investissement immobilier. Gratuit, instantane, sans engagement.",
}: {
  bait?: string;
  subBait?: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const showPopup = useCallback(() => {
    // Anti-spam : 1 fois par navigation (sessionStorage)
    if (sessionStorage.getItem("es-exit-shown-session") === "1") return;
    // Anti-spam : 1 fois par mois (cookie 30j)
    if (document.cookie.includes("es-exit-shown=1")) return;
    // Skip si visiteur deja capture (a un cookie email)
    if (document.cookie.includes("es-lead-email=")) return;

    sessionStorage.setItem("es-exit-shown-session", "1");
    document.cookie = "es-exit-shown=1; path=/; max-age=2592000; SameSite=Lax";
    setOpen(true);
    trackEvent("exit_intent_shown", {});
  }, []);

  useEffect(() => {
    // Skip mobile : pas de souris
    if (window.matchMedia("(max-width: 768px)").matches) return;

    // Delay grace : 5s sur la page avant que le popup puisse fire
    const armedAt = Date.now();
    const ARMED_AFTER_MS = 5000;

    function onMouseLeave(e: MouseEvent) {
      if (Date.now() - armedAt < ARMED_AFTER_MS) return;
      // Souris quitte vers le haut (toolbar/X navigateur)
      if (e.clientY <= 0) {
        showPopup();
      }
    }

    document.addEventListener("mouseleave", onMouseLeave);
    return () => document.removeEventListener("mouseleave", onMouseLeave);
  }, [showPopup]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/forms/exit-intent/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: firstName.trim(),
          consent: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      trackEvent("exit_intent_converted", { email });
      setSuccess(true);
      // Auto-close apres 4s
      setTimeout(() => setOpen(false), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setOpen(false);
            trackEvent("exit_intent_dismissed", {});
          }}
          aria-label="Fermer"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer text-xl"
        >
          ×
        </button>

        {success ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-es-green text-white mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-serif text-xl font-bold text-es-text mb-2">
              C&apos;est dans ta boîte !
            </h2>
            <p className="text-es-text-muted">
              Vérifie tes mails dans 2 min (et tes spams au cas où).
            </p>
          </div>
        ) : (
          <div className="p-8">
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-es-green mb-2">
              Cadeau de départ
            </span>
            <h2 className="font-serif text-2xl font-bold text-es-text mb-2 leading-tight">
              {bait}
            </h2>
            <p className="text-es-text-muted text-sm mb-5">{subBait}</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Ton prénom (optionnel)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30"
                disabled={submitting}
              />
              <input
                type="email"
                required
                placeholder="Ton email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30"
                disabled={submitting}
              />
              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting || !email}
                className="w-full bg-es-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-es-green-light transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Envoi..." : "Recevoir le guide gratuit"}
              </button>
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                En soumettant, j&apos;accepte de recevoir ce guide + des contenus sur l&apos;investissement immobilier.
                Désinscription en 1 clic à tout moment.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
