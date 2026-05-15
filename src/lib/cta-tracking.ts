/**
 * Tracking des clics CTA cote client.
 *
 * Usage automatique : ajoute data-cta="academy-hero-buy" sur un bouton.
 * Le CtaTrackerProvider monte un listener global qui capte le clic et
 * appelle trackCta() pour persister.
 *
 * Usage programmatique : appeler trackCta(id, { email }) avant un submit
 * de form (pour rattacher l'email saisi au tracking).
 *
 * Convention d'ID : kebab-case ou snake_case, prefixe par contexte.
 *   - "academy-hero-buy" : CTA achat sur hero /academy
 *   - "family-pricing-fondateur" : CTA Fondateur sur pricing /family
 *   - "lm-masterclass-formation" : CTA "Decouvre la formation" en bas mc
 */

const SESSION_KEY = "es_cta_session";
const EMAIL_KEY = "es_user_email";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() || Math.random().toString(36).slice(2));
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(EMAIL_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Stocke l'email a utiliser pour les prochains tracking CTA. A appeler
 * apres un submit de form ou un login pour rattacher les CTAs futurs
 * au bon user.
 */
export function setTrackedEmail(email: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (email) localStorage.setItem(EMAIL_KEY, email.toLowerCase());
    else localStorage.removeItem(EMAIL_KEY);
  } catch {
    // best-effort
  }
}

/**
 * Track un clic CTA. Best-effort : si la route echoue, on swallow.
 * Utilise fetch keepalive pour ne pas perdre l'event si l'user navigue
 * dans la foulee.
 */
export function trackCta(ctaId: string, opts?: { email?: string }): void {
  if (typeof window === "undefined") return;
  if (!ctaId) return;

  const url = new URL(window.location.href);
  const params = url.searchParams;
  const email = opts?.email || getStoredEmail();
  const sessionId = getOrCreateSessionId();

  // Persist email so future CTAs sont attribues au meme user
  if (opts?.email) setTrackedEmail(opts.email);

  try {
    void fetch("/api/cta/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cta_id: ctaId,
        page_path: url.pathname,
        email,
        session_id: sessionId,
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        referrer: document.referrer || null,
      }),
      keepalive: true,
    });
  } catch {
    // best-effort
  }
}
