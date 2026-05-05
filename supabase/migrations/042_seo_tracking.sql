-- Migration 042 : tracking SEO + dashboard admin
--
-- 4 tables :
--   - seo_page_views : log brut de chaque vue de page publique (RGPD-friendly,
--     pas de cookie persistent, session_id volatile en sessionStorage)
--   - seo_target_keywords : mots-cles cibles a suivre (priorite, page cible)
--   - seo_audits : un snapshot d'audit SEO (1 audit = N recommandations)
--   - seo_recommendations : items actionnables generes par l'audit
--
-- 3 RPC :
--   - seo_dashboard_stats : KPIs globaux (vues, sessions, recos ouvertes)
--   - seo_top_pages : top pages par vues + sessions uniques sur N jours
--   - seo_top_sources : groupement des referrers en sources lisibles
--
-- RLS active partout : pas de policy = aucun acces client (service role only).

-- ============================================================
-- Table : seo_page_views
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seo_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  user_agent text,
  country text,
  is_bot boolean NOT NULL DEFAULT false,
  session_id text,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seo_page_views_path_idx
  ON public.seo_page_views (path, viewed_at DESC);
CREATE INDEX IF NOT EXISTS seo_page_views_viewed_at_idx
  ON public.seo_page_views (viewed_at DESC);
CREATE INDEX IF NOT EXISTS seo_page_views_session_idx
  ON public.seo_page_views (session_id);
CREATE INDEX IF NOT EXISTS seo_page_views_referrer_idx
  ON public.seo_page_views (referrer);

ALTER TABLE public.seo_page_views ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Table : seo_target_keywords
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seo_target_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL UNIQUE,
  priority int NOT NULL DEFAULT 2,           -- 1=haute, 2=moyenne, 3=basse
  target_page text,                          -- ex: '/academy'
  current_position numeric,                  -- derniere position connue (Search Console)
  current_impressions int,
  current_clicks int,
  last_checked_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seo_target_keywords_priority_idx
  ON public.seo_target_keywords (priority, keyword);

ALTER TABLE public.seo_target_keywords ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.seo_target_keywords_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS seo_target_keywords_updated_at ON public.seo_target_keywords;
CREATE TRIGGER seo_target_keywords_updated_at
  BEFORE UPDATE ON public.seo_target_keywords
  FOR EACH ROW EXECUTE FUNCTION public.seo_target_keywords_set_updated_at();

-- ============================================================
-- Table : seo_audits
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seo_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pages_scanned int NOT NULL DEFAULT 0,
  recommendations_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',  -- completed | failed | running
  duration_ms int,
  error_message text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seo_audits_generated_at_idx
  ON public.seo_audits (generated_at DESC);

ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Table : seo_recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seo_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES public.seo_audits(id) ON DELETE CASCADE,
  type text NOT NULL,                       -- ex: missing_meta_description
  severity text NOT NULL DEFAULT 'medium',  -- high | medium | low
  page_path text,
  title text NOT NULL,
  description text NOT NULL,
  fix_action text,
  status text NOT NULL DEFAULT 'open',      -- open | done | dismissed
  done_at timestamptz,
  done_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seo_recommendations_status_idx
  ON public.seo_recommendations (status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS seo_recommendations_audit_idx
  ON public.seo_recommendations (audit_id);
CREATE INDEX IF NOT EXISTS seo_recommendations_type_path_idx
  ON public.seo_recommendations (type, page_path);

ALTER TABLE public.seo_recommendations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RPC : seo_dashboard_stats(period_days int)
-- ============================================================
CREATE OR REPLACE FUNCTION public.seo_dashboard_stats(period_days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  cutoff timestamptz := now() - (period_days || ' days')::interval;
  prev_cutoff timestamptz := now() - (2 * period_days || ' days')::interval;
BEGIN
  SELECT jsonb_build_object(
    'period_days', period_days,
    'total_views', (
      SELECT count(*) FROM public.seo_page_views
      WHERE viewed_at >= cutoff AND is_bot = false
    ),
    'total_views_prev', (
      SELECT count(*) FROM public.seo_page_views
      WHERE viewed_at >= prev_cutoff AND viewed_at < cutoff AND is_bot = false
    ),
    'unique_sessions', (
      SELECT count(DISTINCT session_id) FROM public.seo_page_views
      WHERE viewed_at >= cutoff AND is_bot = false AND session_id IS NOT NULL
    ),
    'unique_sessions_prev', (
      SELECT count(DISTINCT session_id) FROM public.seo_page_views
      WHERE viewed_at >= prev_cutoff AND viewed_at < cutoff
        AND is_bot = false AND session_id IS NOT NULL
    ),
    'unique_pages', (
      SELECT count(DISTINCT path) FROM public.seo_page_views
      WHERE viewed_at >= cutoff AND is_bot = false
    ),
    'bot_views', (
      SELECT count(*) FROM public.seo_page_views
      WHERE viewed_at >= cutoff AND is_bot = true
    ),
    'open_recos_high', (
      SELECT count(*) FROM public.seo_recommendations
      WHERE status = 'open' AND severity = 'high'
    ),
    'open_recos_medium', (
      SELECT count(*) FROM public.seo_recommendations
      WHERE status = 'open' AND severity = 'medium'
    ),
    'open_recos_total', (
      SELECT count(*) FROM public.seo_recommendations WHERE status = 'open'
    ),
    'tracked_keywords', (
      SELECT count(*) FROM public.seo_target_keywords
    ),
    'last_audit_at', (
      SELECT generated_at FROM public.seo_audits
      WHERE status = 'completed' ORDER BY generated_at DESC LIMIT 1
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ============================================================
-- RPC : seo_top_pages(period_days int, page_limit int)
-- ============================================================
CREATE OR REPLACE FUNCTION public.seo_top_pages(
  period_days int DEFAULT 30,
  page_limit int DEFAULT 20
)
RETURNS TABLE (
  path text,
  views bigint,
  unique_sessions bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pv.path,
    count(*)::bigint AS views,
    count(DISTINCT pv.session_id)::bigint AS unique_sessions
  FROM public.seo_page_views pv
  WHERE pv.viewed_at >= now() - (period_days || ' days')::interval
    AND pv.is_bot = false
  GROUP BY pv.path
  ORDER BY views DESC
  LIMIT page_limit;
$$;

-- ============================================================
-- RPC : seo_top_sources(period_days int, source_limit int)
-- ============================================================
CREATE OR REPLACE FUNCTION public.seo_top_sources(
  period_days int DEFAULT 30,
  source_limit int DEFAULT 20
)
RETURNS TABLE (
  source text,
  sessions bigint,
  views bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH normalized AS (
    SELECT
      session_id,
      CASE
        WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
        WHEN referrer LIKE '%google.%' THEN 'Google'
        WHEN referrer LIKE '%bing.%' THEN 'Bing'
        WHEN referrer LIKE '%duckduckgo.%' THEN 'DuckDuckGo'
        WHEN referrer LIKE '%instagram.%' THEN 'Instagram'
        WHEN referrer LIKE '%facebook.%' OR referrer LIKE '%fb.com%' THEN 'Facebook'
        WHEN referrer LIKE '%linkedin.%' THEN 'LinkedIn'
        WHEN referrer LIKE '%youtube.%' OR referrer LIKE '%youtu.be%' THEN 'YouTube'
        WHEN referrer LIKE '%tiktok.%' THEN 'TikTok'
        WHEN referrer LIKE '%twitter.%' OR referrer LIKE '%x.com%' OR referrer LIKE '%t.co%' THEN 'X (Twitter)'
        WHEN referrer LIKE '%emeline-siron.fr%' THEN 'Direct'
        WHEN referrer LIKE '%otb-podcast.fr%' THEN 'OTB Podcast'
        WHEN referrer LIKE '%solstice-patrimoine.fr%' THEN 'Solstice'
        WHEN referrer LIKE '%ausha.co%' OR referrer LIKE '%spotify.%' OR referrer LIKE '%apple.%' THEN 'Podcast'
        ELSE COALESCE(substring(referrer FROM 'https?://(?:www\.)?([^/]+)'), 'Autre')
      END AS source
    FROM public.seo_page_views
    WHERE viewed_at >= now() - (period_days || ' days')::interval
      AND is_bot = false
  )
  SELECT
    n.source,
    count(DISTINCT n.session_id)::bigint AS sessions,
    count(*)::bigint AS views
  FROM normalized n
  WHERE n.session_id IS NOT NULL
  GROUP BY n.source
  ORDER BY sessions DESC
  LIMIT source_limit;
$$;

-- ============================================================
-- Seed mots-cles cibles initiaux (Emeline Siron, autofinancement)
-- ============================================================
INSERT INTO public.seo_target_keywords (keyword, priority, target_page, notes) VALUES
  ('emeline siron', 1, '/', 'Marque personnelle, requete navigationnelle prioritaire'),
  ('autofinancement immobilier', 1, '/academy', 'Concept signature de la methode'),
  ('methode emeline siron', 1, '/academy', 'Marque + concept'),
  ('investir immobilier sans apport', 1, '/academy', 'Requete commerciale haut de funnel'),
  ('formation immobilier locatif', 1, '/academy', 'Requete commerciale principale'),
  ('formation investissement immobilier', 1, '/academy', 'Variante requete principale'),
  ('investir locatif rentable', 2, '/academy', NULL),
  ('rentabilite immobilier locatif', 2, '/academy', NULL),
  ('strategie immobilier locatif', 2, '/academy', NULL),
  ('investir immobilier debutant', 2, '/academy', 'Persona debutant'),
  ('podcast immobilier', 3, '/podcast', 'OTB peut ramener du trafic'),
  ('communaute investisseurs immobilier', 2, '/family', 'Cible ES Family')
ON CONFLICT (keyword) DO NOTHING;
