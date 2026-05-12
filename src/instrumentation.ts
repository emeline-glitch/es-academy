/**
 * Instrumentation Next.js : called once at server startup for both Node.js
 * runtime (most routes) and Edge runtime (middleware).
 *
 * On charge Sentry server-side seulement si SENTRY_DSN est defini en env :
 * en local sans DSN configure, Sentry ne s'initialise pas et il n'y a aucun
 * cout (pas de network call vers ingest.sentry.io).
 *
 * Voir aussi src/instrumentation-client.ts pour l'init cote browser.
 */
export async function register() {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Pas de DSN = pas de Sentry, on no-op pour eviter les logs warning au demarrage
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/**
 * Hook pour capturer les erreurs des Server Components / Server Actions.
 * Sans ce hook, les exceptions React Server-Side sont logged en console mais
 * pas remontees a Sentry. Avec, on a un trace complet par erreur.
 */
export async function onRequestError(
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string };
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    renderSource:
      | "react-server-components"
      | "react-server-components-payload"
      | "server-rendering";
    revalidateReason: "on-demand" | "stale" | undefined;
    renderType: "dynamic" | "dynamic-resume";
  }
) {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
}
