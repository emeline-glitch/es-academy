/**
 * Sentry edge config : runtime restreint (V8 isolate, pas Node.js APIs).
 * Utilise par le middleware Next.js et certains route handlers.
 *
 * Volontairement minimal : Sentry SDK supporte le runtime edge en restreignant
 * les integrations dispo. On garde l'essentiel : capture des exceptions.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    sampleRate: 1.0,
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    sendDefaultPii: false,
  });
}
