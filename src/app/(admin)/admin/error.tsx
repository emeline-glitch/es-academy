"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error]", error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-6">
        <span className="text-3xl">⚠️</span>
      </div>
      <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">Oups, une erreur est survenue</h1>
      <p className="text-gray-500 mb-2">
        Quelque chose a planté côté admin. Ce n&apos;est pas visible par tes visiteurs.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 font-mono mb-6">Réf : {error.digest}</p>
      )}
      {process.env.NODE_ENV !== "production" && (
        <details className="text-left bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-xs">
          <summary className="cursor-pointer font-semibold text-red-800">Détail technique</summary>
          <pre className="mt-2 overflow-auto text-red-700 whitespace-pre-wrap">{error.message}</pre>
          {error.stack && (
            <pre className="mt-2 overflow-auto text-red-600 whitespace-pre-wrap">{error.stack}</pre>
          )}
        </details>
      )}
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="bg-es-green text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-es-green-light"
        >
          Réessayer
        </button>
        <a
          href="/admin/dashboard"
          className="bg-gray-100 text-gray-700 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-gray-200"
        >
          Retour au dashboard
        </a>
      </div>
    </div>
  );
}
