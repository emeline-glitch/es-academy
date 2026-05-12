"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/**
 * error.tsx racine : capture les exceptions dans les pages publiques
 * (marketing, blog, simulateurs, formulaires...). Les routes (platform)
 * et (admin) ont leur propre error.tsx dedie.
 *
 * Volontairement sobre : on ne montre pas error.message (peut leak des
 * infos sensibles : URL DB, chemin fichier, etc.). On affiche le digest
 * Next pour que l'user puisse le referencer au support.
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log cote client pour Sentry/console. En prod, capture aussi cote serveur.
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-es-cream flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="font-serif text-6xl font-bold text-es-green mb-4">
          Oups.
        </div>
        <h1 className="font-serif text-2xl font-bold text-es-text mb-3">
          Une erreur est survenue
        </h1>
        <p className="text-es-text-muted mb-2 leading-relaxed">
          Notre équipe a été notifiée et regarde ça de près. En attendant tu
          peux réessayer ou revenir à l&apos;accueil.
        </p>
        {error.digest && (
          <p className="text-xs text-es-text-muted/70 font-mono mb-6">
            Réf : {error.digest}
          </p>
        )}
        {!error.digest && <div className="mb-6" />}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="primary">
            Réessayer
          </Button>
          <Button href="/" variant="secondary">
            Retour à l&apos;accueil
          </Button>
        </div>

        <p className="text-xs text-es-text-muted/70 mt-8">
          Si le problème persiste, écris-nous à{" "}
          <a
            href="mailto:emeline@emeline-siron.fr"
            className="underline hover:text-es-green"
          >
            emeline@emeline-siron.fr
          </a>
          {error.digest ? ` (mentionne la réf ${error.digest})` : ""}
        </p>
      </div>
    </div>
  );
}
