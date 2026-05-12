"use client";

import { useEffect } from "react";

/**
 * global-error.tsx : capture les erreurs DU root layout lui-meme. Cas
 * extreme (provider crash, font load fail, error sync dans layout, etc).
 *
 * IMPORTANT : Next exige qu'on rende un <html> + <body> complets ici, car
 * le root layout n'a pas pu se monter. Pas d'acces a Tailwind/globals.css
 * garanti si la cascade CSS est cassee : on inline les styles essentiels.
 *
 * 99,9% des erreurs sont catch par src/app/error.tsx ou les segments
 * dedies. global-error.tsx est le filet de tout dernier recours.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error.tsx]", error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#fafaf5",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#1f2937",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            padding: "2rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "3rem",
              fontWeight: 700,
              color: "#2c6e55",
              marginBottom: "1rem",
            }}
          >
            Oups.
          </div>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              marginTop: 0,
              marginBottom: "0.75rem",
            }}
          >
            Le site rencontre un problème
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              lineHeight: 1.5,
              color: "#6b7280",
              marginBottom: error.digest ? "0.5rem" : "1.5rem",
            }}
          >
            Notre équipe a été notifiée. Tu peux réessayer dans quelques
            instants ou nous écrire à{" "}
            <a
              href="mailto:emeline@emeline-siron.fr"
              style={{ color: "#2c6e55" }}
            >
              emeline@emeline-siron.fr
            </a>
            .
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                marginBottom: "1.5rem",
              }}
            >
              Réf : {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              backgroundColor: "#2c6e55",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.95rem",
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
