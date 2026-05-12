/**
 * Sentry server-side config (Node.js runtime).
 * Importe par src/instrumentation.ts.
 *
 * Capture les exceptions des :
 *  - API routes (/api/*)
 *  - Server Components
 *  - Server Actions
 *  - Cron handlers
 *  - Webhook Stripe / SES SNS
 *
 * Cote securite : ne PAS attacher de PII (email, payment info). Sentry
 * autorise scrub via beforeSend mais on prefere ne pas envoyer en premier
 * lieu via integrations: [] minimal.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Sample 100% des erreurs (gratuit jusqu'a 5K events/mois)
    sampleRate: 1.0,
    // Performance tracing 10% : suffisant pour identifier patterns lents
    // sans saturer le quota.
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    // Release tagging via le commit SHA Vercel pour grouper les erreurs par deploy
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // PII off par defaut : on veut pas leak email / Stripe customer ID dans les
    // breadcrumbs. Si besoin de debug specifique, on peut whitelist.
    sendDefaultPii: false,

    // Scrub des body / headers sensibles avant envoi.
    beforeSend(event) {
      // Remove cookies (peut contenir session Supabase)
      if (event.request?.cookies) delete event.request.cookies;
      // Scrub headers sensibles
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      return event;
    },
  });
}
