-- Migration 043 : UTM tracking sur seo_page_views
--
-- Capture les UTM parameters (source, medium, campaign, term, content) sur
-- chaque page view + landing_path (premiere page de la session) pour pouvoir
-- attribuer les conversions a la bonne campagne marketing.
--
-- Strategie d'attribution :
--  - First-touch : on garde le 1er utm_source vu (cookie persistant 30j)
--  - Stocke aussi le landing_path pour reconnaitre les pages d'entree
--
-- En croisant avec contact_events.event_type='enrollment' (CA en DB), on peut
-- calculer le ROI par campagne sans dependre de GA4.

ALTER TABLE public.seo_page_views
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS landing_path text,
  ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS fbclid text;

-- Index pour requetes de reporting par campagne
CREATE INDEX IF NOT EXISTS seo_page_views_utm_source_idx
  ON public.seo_page_views (utm_source, viewed_at DESC)
  WHERE utm_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS seo_page_views_utm_campaign_idx
  ON public.seo_page_views (utm_campaign, viewed_at DESC)
  WHERE utm_campaign IS NOT NULL;

-- ============================================================
-- RPC : seo_top_campaigns (ROI par campagne)
-- ============================================================
CREATE OR REPLACE FUNCTION public.seo_top_campaigns(
  period_days int DEFAULT 30,
  campaign_limit int DEFAULT 20
)
RETURNS TABLE (
  utm_source text,
  utm_medium text,
  utm_campaign text,
  sessions bigint,
  views bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pv.utm_source,
    pv.utm_medium,
    pv.utm_campaign,
    count(DISTINCT pv.session_id)::bigint AS sessions,
    count(*)::bigint AS views
  FROM public.seo_page_views pv
  WHERE pv.viewed_at >= now() - (period_days || ' days')::interval
    AND pv.is_bot = false
    AND pv.utm_source IS NOT NULL
  GROUP BY pv.utm_source, pv.utm_medium, pv.utm_campaign
  ORDER BY sessions DESC
  LIMIT campaign_limit;
$$;
