-- 056_dashboard_revenue_metrics : 2 nouvelles RPC pour le dashboard commercial.
--
-- 1. revenue_by_source : CA genere par source d'acquisition (newsletter,
--    podcast, instagram, etc.) sur N derniers jours. Repond a la question
--    "Quelle campagne / canal me rapporte le plus ?".
--
-- 2. family_mrr : MRR Family (29 fondateur * actifs + 29 standard * actifs)
--    + nb trial + nb resilies 30j + churn rate. Sort Family du "CA total"
--    qui melangeait one-shot Academy et recurrent Family.
--
-- Both sont SECURITY DEFINER pour bypass RLS (sinon le service_role doit faire
-- des selects independants et performance n*m).

-- ---------------------------------------------------------------------------
-- 1. revenue_by_source
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revenue_by_source(period_days INT DEFAULT 30)
RETURNS TABLE (
  source TEXT,
  contacts_count BIGINT,
  buyers_count BIGINT,
  revenue_cents BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
  buyers AS (
    SELECT
      c.id AS contact_id,
      COALESCE(c.source, 'inconnue') AS source,
      COALESCE(SUM(e.amount_paid), 0) AS rev
    FROM public.contacts c
    LEFT JOIN public.profiles p ON LOWER(p.email) = LOWER(c.email)
    LEFT JOIN public.enrollments e
      ON e.user_id = p.id
     AND e.purchased_at >= NOW() - (period_days || ' days')::interval
     AND e.status = 'active'
    GROUP BY c.id, COALESCE(c.source, 'inconnue')
  )
  SELECT
    source,
    COUNT(*)::BIGINT AS contacts_count,
    COUNT(*) FILTER (WHERE rev > 0)::BIGINT AS buyers_count,
    SUM(rev)::BIGINT AS revenue_cents
  FROM buyers
  GROUP BY source
  ORDER BY revenue_cents DESC, contacts_count DESC;
$$;

GRANT EXECUTE ON FUNCTION public.revenue_by_source(INT) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. family_mrr
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.family_mrr()
RETURNS TABLE (
  active_count BIGINT,
  trial_count BIGINT,
  canceled_30d BIGINT,
  mrr_cents BIGINT,
  churn_rate_pct NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'active') AS active_count,
      COUNT(*) FILTER (WHERE status = 'trialing') AS trial_count,
      COUNT(*) FILTER (
        WHERE status IN ('canceled', 'cancelled')
        AND updated_at >= NOW() - INTERVAL '30 days'
      ) AS canceled_30d,
      (
        COUNT(*) FILTER (WHERE status = 'active' AND plan = 'fondateur') * 1900 +
        COUNT(*) FILTER (WHERE status = 'active' AND plan = 'standard') * 2900
      ) AS mrr_cents
    FROM public.family_subscriptions
  )
  SELECT
    active_count::BIGINT,
    trial_count::BIGINT,
    canceled_30d::BIGINT,
    mrr_cents::BIGINT,
    CASE
      WHEN active_count > 0 THEN
        ROUND(100.0 * canceled_30d / (active_count + canceled_30d), 1)
      ELSE 0
    END AS churn_rate_pct
  FROM stats;
$$;

GRANT EXECUTE ON FUNCTION public.family_mrr() TO authenticated, service_role;
