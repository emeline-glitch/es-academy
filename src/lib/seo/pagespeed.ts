import { createServiceClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/utils/constants";

/**
 * Integration PageSpeed Insights API de Google.
 *
 * API publique, gratuite jusqu'a 25 000 requetes/jour sans cle (rate limit
 * a 4 requetes/sec). Avec une cle API gratuite (Google Cloud), on monte a
 * 25k/jour + meilleur rate limit.
 *
 * Retourne :
 *  - Scores Lighthouse (Performance, Accessibility, Best Practices, SEO)
 *  - Core Web Vitals (LCP, INP, CLS) en field data (CrUX) si dispo, sinon lab
 *
 * Note : Field data (CrUX) demande un minimum de trafic sur la page. Si trop
 * peu de trafic, on prend les valeurs lab (issues de Lighthouse synthetique).
 */

const PAGESPEED_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export interface PageSpeedResult {
  page_path: string;
  strategy: "mobile" | "desktop";
  score_performance: number | null;
  score_accessibility: number | null;
  score_best_practices: number | null;
  score_seo: number | null;
  lcp_ms: number | null;
  inp_ms: number | null;
  cls: number | null;
  fcp_ms: number | null;
  ttfb_ms: number | null;
  raw_lighthouse_url: string | null;
  api_error: string | null;
}

export async function runPageSpeedAudit(
  pagePath: string,
  strategy: "mobile" | "desktop" = "mobile"
): Promise<PageSpeedResult> {
  const url = `${SITE_URL}${pagePath}`;
  const params = new URLSearchParams({
    url,
    strategy,
    category: "performance",
    locale: "fr",
  });
  // PageSpeed renvoie plusieurs categories si on les ajoute en params multiples
  params.append("category", "accessibility");
  params.append("category", "best-practices");
  params.append("category", "seo");
  if (process.env.GOOGLE_PAGESPEED_API_KEY) {
    params.append("key", process.env.GOOGLE_PAGESPEED_API_KEY);
  }

  const result: PageSpeedResult = {
    page_path: pagePath,
    strategy,
    score_performance: null,
    score_accessibility: null,
    score_best_practices: null,
    score_seo: null,
    lcp_ms: null,
    inp_ms: null,
    cls: null,
    fcp_ms: null,
    ttfb_ms: null,
    raw_lighthouse_url: null,
    api_error: null,
  };

  try {
    const res = await fetch(`${PAGESPEED_API}?${params.toString()}`, {
      // 60s timeout (PageSpeed prend 10-30s typiquement)
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) {
      const txt = await res.text();
      result.api_error = `HTTP ${res.status}: ${txt.slice(0, 200)}`;
      return result;
    }
    const data = (await res.json()) as Record<string, unknown>;

    const lh = (data.lighthouseResult || {}) as Record<string, unknown>;
    const categories = (lh.categories || {}) as Record<string, { score?: number }>;
    const audits = (lh.audits || {}) as Record<string, Record<string, unknown>>;

    result.score_performance = round100(categories.performance?.score);
    result.score_accessibility = round100(categories.accessibility?.score);
    result.score_best_practices = round100(categories["best-practices"]?.score);
    result.score_seo = round100(categories.seo?.score);

    // Lab Core Web Vitals (toujours dispo)
    result.lcp_ms = numericValue(audits["largest-contentful-paint"]);
    result.fcp_ms = numericValue(audits["first-contentful-paint"]);
    result.ttfb_ms = numericValue(audits["server-response-time"]);
    result.cls = numericValue(audits["cumulative-layout-shift"], 3);

    // INP en lab : "interaction-to-next-paint" si dispo (sinon TBT comme proxy)
    result.inp_ms = numericValue(audits["interaction-to-next-paint"]) ??
                    numericValue(audits["interactive"]);

    // Field data CrUX (overrides si dispo, plus precis car real user data)
    const loadingExperience = (data.loadingExperience || {}) as Record<string, unknown>;
    const metrics = (loadingExperience.metrics || {}) as Record<string, { percentile?: number }>;
    if (metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile != null) {
      result.lcp_ms = metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile;
    }
    if (metrics.INTERACTION_TO_NEXT_PAINT?.percentile != null) {
      result.inp_ms = metrics.INTERACTION_TO_NEXT_PAINT.percentile;
    }
    if (metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null) {
      // CrUX retourne CLS x 100, on remet en decimal
      result.cls = (metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile || 0) / 100;
    }
    if (metrics.FIRST_CONTENTFUL_PAINT_MS?.percentile != null) {
      result.fcp_ms = metrics.FIRST_CONTENTFUL_PAINT_MS.percentile;
    }
    if (metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile != null) {
      result.ttfb_ms = metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.percentile;
    }

    // Lien direct vers rapport Lighthouse (si fourni par l'API)
    if (typeof lh.finalUrl === "string") {
      result.raw_lighthouse_url = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}&form_factor=${strategy}`;
    }
  } catch (e) {
    result.api_error = e instanceof Error ? e.message : "unknown error";
  }

  return result;
}

function round100(score: number | undefined): number | null {
  if (score == null) return null;
  return Math.round(score * 100);
}

function numericValue(audit: Record<string, unknown> | undefined, decimals = 0): number | null {
  if (!audit) return null;
  const v = audit.numericValue;
  if (typeof v !== "number") return null;
  return decimals === 0 ? Math.round(v) : Number(v.toFixed(decimals));
}

export async function persistPageSpeedResult(result: PageSpeedResult): Promise<void> {
  const supabase = await createServiceClient();
  await supabase.from("seo_pagespeed_history").insert({
    page_path: result.page_path,
    strategy: result.strategy,
    score_performance: result.score_performance,
    score_accessibility: result.score_accessibility,
    score_best_practices: result.score_best_practices,
    score_seo: result.score_seo,
    lcp_ms: result.lcp_ms,
    inp_ms: result.inp_ms,
    cls: result.cls,
    fcp_ms: result.fcp_ms,
    ttfb_ms: result.ttfb_ms,
    raw_lighthouse_url: result.raw_lighthouse_url,
    api_error: result.api_error,
  });
}

export async function auditAllKeyLandings(
  paths: string[],
  strategy: "mobile" | "desktop" = "mobile"
): Promise<{ ok: number; failed: number; results: PageSpeedResult[] }> {
  let ok = 0;
  let failed = 0;
  const results: PageSpeedResult[] = [];
  // Sequentiel : PageSpeed rate-limit 4 req/sec sans key, on reste tranquille
  for (const path of paths) {
    const r = await runPageSpeedAudit(path, strategy);
    await persistPageSpeedResult(r);
    if (r.api_error) failed++;
    else ok++;
    results.push(r);
    // Petite pause pour rester sous le rate limit
    await new Promise((r) => setTimeout(r, 500));
  }
  return { ok, failed, results };
}
