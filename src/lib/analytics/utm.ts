/**
 * UTM tracking : capture + persistance en cookie + envoi vers GA4/Supabase.
 *
 * Strategie : first-touch attribution
 *  - Si l'URL contient des UTM, on les capture et stocke en cookie 30 jours
 *  - Si le cookie existe deja, on NE l'ecrase PAS (on garde le 1er utm_source vu)
 *  - Tous les hits suivants envoient les UTM du cookie au /api/track/page-view
 *
 * Pour les Ads : permet de voir "Meta Ads campagne hiver 2026 a genere X visites
 * et Y conversions purchase" meme si le user a navigue 5 pages avant d'acheter.
 */

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const CLICK_ID_KEYS = ["gclid", "fbclid"] as const;
const COOKIE_NAME = "__es_attribution";
const COOKIE_MAX_AGE = 30 * 24 * 3600; // 30 jours

export type AttributionData = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  landing_path?: string;
  captured_at?: string;
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Lit l'attribution stockee. Si l'URL courante contient des UTM, les capture
 * en cookie (first-touch : ne remplace pas un cookie existant).
 *
 * Retourne l'attribution courante (depuis cookie ou URL).
 */
export function captureAttribution(): AttributionData {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const fromUrl: AttributionData = {};
  let hasUtm = false;

  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) {
      fromUrl[k] = v.slice(0, 200);
      hasUtm = true;
    }
  }
  for (const k of CLICK_ID_KEYS) {
    const v = params.get(k);
    if (v) {
      fromUrl[k] = v.slice(0, 200);
      hasUtm = true;
    }
  }

  // Cookie existant ?
  const existing = readAttribution();

  // First-touch : si on a deja une attribution en cookie, on ne l'ecrase PAS
  if (Object.keys(existing).length > 0 && !hasUtm) {
    return existing;
  }

  // Si URL a des UTM et pas d'attribution existante : on capture
  if (hasUtm && Object.keys(existing).length === 0) {
    fromUrl.landing_path = window.location.pathname;
    fromUrl.captured_at = new Date().toISOString();
    try {
      setCookie(COOKIE_NAME, JSON.stringify(fromUrl), COOKIE_MAX_AGE);
    } catch {
      // cookie indispo (private mode), on retourne quand meme
    }
    return fromUrl;
  }

  // Sinon retourne l'existant
  return existing;
}

export function readAttribution(): AttributionData {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AttributionData;
  } catch {
    return {};
  }
}

export function clearAttribution() {
  setCookie(COOKIE_NAME, "", -1);
}
