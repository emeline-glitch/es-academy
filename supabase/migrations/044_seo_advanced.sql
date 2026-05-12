-- Migration 044 : SEO avance (settings DB-editables + PageSpeed history + keyword positions history)
--
-- Objectif : tout le tracking SEO/visibilite est DB-editable depuis /admin/seo,
-- plus rien n'est hardcode. Permet de suivre l'evolution dans le temps.
--
-- 3 nouvelles tables :
--   - seo_settings : key-value pour config audit (pages strategiques, seuils, etc.)
--   - seo_pagespeed_history : snapshots Core Web Vitals (LCP, INP, CLS, scores Lighthouse)
--   - seo_keyword_history : timeseries des positions Search Console (saisie manuelle ou API)

-- ============================================================
-- seo_settings : config key-value (JSON values pour flexibilite)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seo_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.seo_settings_set_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS seo_settings_updated_at ON public.seo_settings;
CREATE TRIGGER seo_settings_updated_at
  BEFORE UPDATE ON public.seo_settings
  FOR EACH ROW EXECUTE FUNCTION public.seo_settings_set_updated_at();

-- Seed initial : KEY_LANDINGS + seuils (anciennement hardcodes dans audit.ts)
INSERT INTO public.seo_settings (key, value, description) VALUES
  ('key_landings', '[
    {"path": "/", "label": "Homepage", "severity": "high", "monitor": true},
    {"path": "/academy", "label": "Page de vente Academy", "severity": "high", "monitor": true},
    {"path": "/family", "label": "Page de vente Family", "severity": "high", "monitor": true},
    {"path": "/cahier-preview", "label": "Cahier preview (lead magnet)", "severity": "medium", "monitor": true},
    {"path": "/podcast", "label": "Page podcast", "severity": "medium", "monitor": true},
    {"path": "/a-propos", "label": "A propos", "severity": "medium", "monitor": true},
    {"path": "/blog", "label": "Listing blog", "severity": "medium", "monitor": true},
    {"path": "/glossaire", "label": "Glossaire", "severity": "medium", "monitor": true},
    {"path": "/outils-gratuits", "label": "Outils gratuits", "severity": "medium", "monitor": true}
  ]'::jsonb, 'Pages strategiques a monitorer (audit trafic + PageSpeed + verif HTML live)'),
  ('audit_thresholds', '{
    "title_min": 30,
    "title_max": 60,
    "desc_min": 70,
    "desc_max": 160,
    "article_stale_days": 365,
    "key_landing_min_views_30d": 30,
    "article_low_views_30d": 5,
    "publish_recent_days": 30
  }'::jsonb, 'Seuils utilises par l''auditeur SEO (longueurs meta, anciennete article, etc.)'),
  ('google_search_url', '"https://www.google.com/search?q=site:emeline-siron.fr"'::jsonb,
    'URL Google utilisee pour estimer le nombre de pages indexees (a ouvrir manuellement, count visible dans la SERP)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- seo_pagespeed_history : Core Web Vitals + scores Lighthouse par page
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seo_pagespeed_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  strategy text NOT NULL CHECK (strategy IN ('mobile', 'desktop')),
  -- Scores Lighthouse (0-100)
  score_performance int,
  score_accessibility int,
  score_best_practices int,
  score_seo int,
  -- Core Web Vitals (Google CrUX field data si dispo, sinon lab data)
  lcp_ms int,                         -- Largest Contentful Paint (ms)
  inp_ms int,                         -- Interaction to Next Paint (ms)
  cls numeric(6,3),                   -- Cumulative Layout Shift
  fcp_ms int,                         -- First Contentful Paint (ms)
  ttfb_ms int,                        -- Time to First Byte (ms)
  -- Meta
  fetched_at timestamptz NOT NULL DEFAULT now(),
  api_error text,                     -- si l'API a fail
  raw_lighthouse_url text             -- URL du rapport Lighthouse complet
);

CREATE INDEX IF NOT EXISTS seo_pagespeed_history_path_idx
  ON public.seo_pagespeed_history (page_path, fetched_at DESC);
CREATE INDEX IF NOT EXISTS seo_pagespeed_history_fetched_at_idx
  ON public.seo_pagespeed_history (fetched_at DESC);

ALTER TABLE public.seo_pagespeed_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- seo_keyword_history : timeseries des positions Search Console
-- Saisie manuelle pour le MVP (org policy Google bloque le service account
-- pour automatiser l'API Search Console). Au minimum 1 saisie par semaine
-- pour avoir une courbe d'evolution.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seo_keyword_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id uuid NOT NULL REFERENCES public.seo_target_keywords(id) ON DELETE CASCADE,
  position numeric(5,1),              -- position moyenne (1.0 = premier)
  impressions int,                    -- nombre d'impressions sur la periode
  clicks int,                         -- nombre de clics
  ctr numeric(5,4),                   -- taux de clic (0.0123 = 1.23%)
  period_start date,                  -- debut periode des stats (ex: 2026-05-01)
  period_end date,                    -- fin periode (ex: 2026-05-07)
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'gsc_api')),
  notes text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid
);

CREATE INDEX IF NOT EXISTS seo_keyword_history_keyword_idx
  ON public.seo_keyword_history (keyword_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS seo_keyword_history_recorded_at_idx
  ON public.seo_keyword_history (recorded_at DESC);

ALTER TABLE public.seo_keyword_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RPC : seo_latest_pagespeed (derniere mesure par page)
-- ============================================================
CREATE OR REPLACE FUNCTION public.seo_latest_pagespeed(target_strategy text DEFAULT 'mobile')
RETURNS TABLE (
  page_path text,
  score_performance int,
  score_accessibility int,
  score_best_practices int,
  score_seo int,
  lcp_ms int,
  inp_ms int,
  cls numeric(6,3),
  fetched_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (page_path)
    page_path,
    score_performance,
    score_accessibility,
    score_best_practices,
    score_seo,
    lcp_ms,
    inp_ms,
    cls,
    fetched_at
  FROM public.seo_pagespeed_history
  WHERE strategy = target_strategy
  ORDER BY page_path, fetched_at DESC;
$$;

-- ============================================================
-- RPC : seo_keyword_history_chart (evolution position d'un mot-cle)
-- ============================================================
CREATE OR REPLACE FUNCTION public.seo_keyword_history_chart(
  kw_id uuid,
  period_days int DEFAULT 90
)
RETURNS TABLE (
  recorded_at timestamptz,
  avg_position numeric,
  impressions int,
  clicks int,
  ctr numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    h.recorded_at,
    h.position AS avg_position,
    h.impressions,
    h.clicks,
    h.ctr
  FROM public.seo_keyword_history h
  WHERE h.keyword_id = kw_id
    AND h.recorded_at >= now() - (period_days || ' days')::interval
  ORDER BY h.recorded_at ASC;
$$;
