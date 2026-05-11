"use client";

import { useState } from "react";

/**
 * Bouton "Family" en mode "lancement en attente" (App iOS en validation Apple).
 *
 * Au clic, affiche un message informatif au lieu de rediriger vers Stripe checkout.
 * Style identique au bouton Family normal pour ne pas casser le design des pages,
 * mais avec un disclaimer en sous-titre.
 */
export function FamilyLaunchPendingButton({
  className = "",
  label = "Rejoindre ES Family",
}: {
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${className} relative group`}
      >
        <span>{label}</span>
        <span className="block text-[11px] font-normal opacity-80 mt-1">
          Lancement imminent
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-2xl font-bold text-es-text mb-3">
              ES Family arrive
            </h3>
            <p className="text-es-text-muted leading-relaxed mb-6">
              L&apos;application mobile ES Family est actuellement en validation
              Apple pour l&apos;App Store. On affine aussi les derniers details :
              espace partenaires, bons plans, coaching, sequences d&apos;onboarding.
            </p>
            <p className="text-es-text-muted leading-relaxed mb-6">
              Le lancement officiel arrive dans les prochains jours. En attendant,
              <strong className="text-es-mint-dark"> ES Academy reste accessible</strong> :
              elle inclut 3 mois d&apos;acces a Family offerts a son lancement.
            </p>
            <div className="flex gap-3">
              <a
                href="/academy"
                className="flex-1 text-center font-semibold rounded-lg px-5 py-3 bg-es-green text-white hover:bg-es-green-light transition-colors"
              >
                Decouvrir ES Academy
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-5 py-3 text-sm text-es-text-muted hover:text-es-text"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Bandeau d'info en haut de page /family quand le lancement est en attente.
 */
export function FamilyLaunchPendingBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-6xl mx-auto px-6 py-3 text-center">
        <p className="text-sm text-amber-900">
          <strong>🍎 App ES Family en validation Apple.</strong>{" "}
          Lancement officiel dans les prochains jours. Les inscriptions ouvriront
          au moment du lancement.
        </p>
      </div>
    </div>
  );
}
