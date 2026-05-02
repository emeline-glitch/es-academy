"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SimulatorCaptureProps {
  /** Slug du simulateur pour tagging CRM (ex: "capacite-emprunt") */
  simulatorType: string;
  /** Affiché après que l'utilisateur a lancé son premier calcul */
  hasCalculated: boolean;
  /** Données du formulaire utilisateur */
  formInputs: Record<string, unknown>;
  /** Résultats calculés */
  formOutputs: Record<string, unknown>;
  /** Titre du bloc Next Step contextuel */
  nextStepTitle: string;
  /** Corps du bloc Next Step */
  nextStepBody: string;
}

/**
 * Composant affiché sous les résultats d'un simulateur.
 * 1. Modal de capture email (s'affiche une fois après le premier calcul)
 * 2. Bloc Next Step contextuel (toujours visible)
 *
 * Envoie les leads vers /api/contacts avec tag simulateur_<slug>
 */
export function SimulatorCapture({
  simulatorType,
  hasCalculated,
  formInputs,
  formOutputs,
  nextStepTitle,
  nextStepBody,
}: SimulatorCaptureProps) {
  const [showModal, setShowModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Déclenche la modal une seule fois après le premier calcul
  useEffect(() => {
    if (hasCalculated && !hasShownModal) {
      const timer = setTimeout(() => {
        setShowModal(true);
        setHasShownModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasCalculated, hasShownModal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !consent) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: `simulateur_${simulatorType}`,
          tags: ["simulateur", `simulateur_${simulatorType}`],
          metadata: {
            simulator_type: simulatorType,
            form_inputs: formInputs,
            form_outputs: formOutputs,
            timestamp: new Date().toISOString(),
            consent_marketing: consent,
          },
        }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        // Fallback localStorage si l'API échoue
        const stored = JSON.parse(localStorage.getItem("simulator_captures") || "[]");
        stored.push({
          email,
          simulator_type: simulatorType,
          form_inputs: formInputs,
          form_outputs: formOutputs,
          timestamp: new Date().toISOString(),
          consent_marketing: consent,
        });
        localStorage.setItem("simulator_captures", JSON.stringify(stored));
        setStatus("success");
      }
    } catch {
      // Fallback localStorage en cas d'erreur réseau
      const stored = JSON.parse(localStorage.getItem("simulator_captures") || "[]");
      stored.push({
        email,
        simulator_type: simulatorType,
        form_inputs: formInputs,
        form_outputs: formOutputs,
        timestamp: new Date().toISOString(),
        consent_marketing: consent,
      });
      localStorage.setItem("simulator_captures", JSON.stringify(stored));
      setStatus("success");
    }
  }

  return (
    <>
      {/* Modal capture email */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {status === "success" ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-es-green/10 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-7 h-7 text-es-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl font-bold text-es-text mb-2">Ton email est parti !</h3>
                <p className="text-sm text-es-text-muted">Regarde ta boîte mail (et les spams, au cas où).</p>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-2xl font-bold text-es-text mb-2">Reçois ton analyse détaillée par email.</h3>
                <p className="text-sm text-es-text-muted mb-5">
                  Ton résultat détaillé, les leviers pour l&apos;améliorer et un PDF pédagogique envoyé en 30 secondes.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ton email"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-es-cream-dark bg-white text-sm focus:outline-none focus:ring-2 focus:ring-es-terracotta/30"
                  />
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 accent-es-terracotta"
                    />
                    <span className="text-xs text-es-text-muted leading-relaxed">
                      J&apos;accepte de recevoir les analyses et conseils d&apos;Emeline Siron. Désinscription possible à tout moment.
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={status === "loading" || !consent || !email}
                    className="w-full px-4 py-3 rounded-lg bg-es-terracotta text-white font-semibold hover:bg-es-terracotta-dark transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {status === "loading" ? "Envoi..." : "Recevoir mon analyse"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Next Step contextuel */}
      {hasCalculated && (
        <div className="mt-12 rounded-2xl overflow-hidden" style={{ backgroundColor: "#006B58" }}>
          <div className="relative p-8 md:p-10 text-white">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <h3 className="font-serif text-2xl font-bold mb-3">{nextStepTitle}</h3>
              <p className="text-white/90 mb-6 leading-relaxed">{nextStepBody}</p>
              <Link
                href="/simulateurs/appel-decouverte"
                className="inline-flex items-center justify-center font-semibold rounded-lg px-6 py-3 bg-white text-es-terracotta hover:bg-es-cream transition-all shadow-md"
              >
                Réserver un appel découverte gratuit (30 min)
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
