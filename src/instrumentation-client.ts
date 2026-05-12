/**
 * Sentry client-side config (browser).
 *
 * Convention Next.js 16 : ce fichier est auto-detecte si nomme
 * `instrumentation-client.ts` et place dans le src/ (ou racine).
 *
 * Capture les exceptions client : React render errors, fetch errors non-catch,
 * promise rejections, etc. Limite la quantite d'evenements via sampling.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    sampleRate: 1.0,
    // Performance tracing limite cote client pour pas saturer Sentry quota
    // free tier ni alourdir le bundle. 5% suffisent pour pattern detection.
    tracesSampleRate: 0.05,
    // Session replay : utile pour debug UX, mais cher en quota.
    // On l'active uniquement sur les erreurs (replaysOnErrorSampleRate),
    // pas sur les sessions normales (replaysSessionSampleRate=0).
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,

    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development",
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    sendDefaultPii: false,

    // Integrations browser : on garde le defaut (Sentry.browserTracingIntegration
    // + breadcrumbs) sans rajouter les integrations payantes.
    integrations: [Sentry.replayIntegration()],

    beforeSend(event) {
      // Scrub cookies / Authorization en cas de fetch logged
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      return event;
    },
  });
}
