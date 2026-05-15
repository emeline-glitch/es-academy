-- 059_cta_tracking : tracking des clics CTA pour attribution ventes.
--
-- Objectif : repondre a la question "quel bouton/CTA me rapporte le plus
-- de ventes ?". Aujourd'hui on a les pages vues (seo) et le CA par source
-- (revenue_by_source) mais pas le tracking par CTA individuel.
--
-- Modele : on enregistre chaque clic sur un CTA tagge avec data-cta="xxx".
-- L'attribution se fait par email (si l'user est connecte ou laisse son
-- mail dans un form quelques minutes apres) ou par session_id pour les
-- visites anonymes.

CREATE TABLE IF NOT EXISTS public.cta_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cta_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  email TEXT,
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour join attribution + analytics
CREATE INDEX IF NOT EXISTS idx_cta_clicks_email ON public.cta_clicks(LOWER(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cta_clicks_cta_id_created ON public.cta_clicks(cta_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cta_clicks_session ON public.cta_clicks(session_id) WHERE session_id IS NOT NULL;

-- RLS : la table est ecrite par l'API server-side (service role).
-- Read accessible aux authenticated admins via les RPCs ci-dessous.
ALTER TABLE public.cta_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cta_clicks service write"
  ON public.cta_clicks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- RPC cta_attribution : pour chaque cta_id, agrege clicks + ventes + CA.
--
-- Attribution : un click CTA est "attribue" a un enrollment si :
--   - email du click = email du contact lie a l'enrollment
--   - click survenu dans les 30 jours avant l'enrollment
--
-- Plusieurs CTAs peuvent etre attribues au meme enrollment (parcours
-- multi-touch). Dans ce premier jalon on compte chaque CTA fois la valeur
-- entiere (pas de splitting). Mieux qu'aujourd'hui (zero attribution).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cta_attribution(period_days INT DEFAULT 30)
RETURNS TABLE (
  cta_id TEXT,
  clicks_count BIGINT,
  unique_emails BIGINT,
  conversions_count BIGINT,
  conversion_rate NUMERIC,
  attributed_revenue_cents BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH clicks AS (
    SELECT
      cta_id,
      LOWER(email) AS email_lc,
      created_at
    FROM public.cta_clicks
    WHERE created_at >= NOW() - (period_days || ' days')::interval
  ),
  attributions AS (
    SELECT
      c.cta_id,
      c.email_lc,
      MIN(e.amount_paid) AS amount_paid
    FROM clicks c
    LEFT JOIN public.profiles p ON LOWER(p.email) = c.email_lc
    LEFT JOIN public.enrollments e
      ON e.user_id = p.id
     AND e.purchased_at BETWEEN c.created_at AND c.created_at + INTERVAL '30 days'
     AND e.status = 'active'
    WHERE c.email_lc IS NOT NULL
    GROUP BY c.cta_id, c.email_lc
  )
  SELECT
    c.cta_id,
    COUNT(*)::BIGINT AS clicks_count,
    COUNT(DISTINCT c.email_lc) FILTER (WHERE c.email_lc IS NOT NULL)::BIGINT AS unique_emails,
    COUNT(DISTINCT a.email_lc) FILTER (WHERE a.amount_paid IS NOT NULL)::BIGINT AS conversions_count,
    CASE
      WHEN COUNT(DISTINCT c.email_lc) FILTER (WHERE c.email_lc IS NOT NULL) > 0 THEN
        ROUND(100.0 * COUNT(DISTINCT a.email_lc) FILTER (WHERE a.amount_paid IS NOT NULL)
              / NULLIF(COUNT(DISTINCT c.email_lc) FILTER (WHERE c.email_lc IS NOT NULL), 0), 1)
      ELSE 0
    END AS conversion_rate,
    COALESCE(SUM(a.amount_paid) FILTER (WHERE a.amount_paid IS NOT NULL), 0)::BIGINT AS attributed_revenue_cents
  FROM clicks c
  LEFT JOIN attributions a ON a.cta_id = c.cta_id AND a.email_lc = c.email_lc
  GROUP BY c.cta_id
  ORDER BY attributed_revenue_cents DESC, clicks_count DESC;
$$;

GRANT EXECUTE ON FUNCTION public.cta_attribution(INT) TO authenticated, service_role;
