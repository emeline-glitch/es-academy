-- 060_dashboard_ltv_cohorts_funnel : 3 nouvelles RPC pour finir le Lot C.
--
-- 1. customer_ltv : LTV par segment (academy_only, family_only, both).
--    Repond a "ou sont mes meilleurs clients".
-- 2. conversion_cohorts : par mois d'arrivee CRM, combien sont devenus
--    clients dans les mois suivants. Repond a "quel est le delai reel
--    de conversion".
-- 3. lead_magnet_funnel : par lead magnet, opt-ins -> achats Academy.
--    Repond a "quel lead magnet convertit le mieux".

-- ---------------------------------------------------------------------------
-- 1. LTV par segment
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.customer_ltv()
RETURNS TABLE (
  segment TEXT,
  customers_count BIGINT,
  total_revenue_cents BIGINT,
  avg_ltv_cents BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH per_user AS (
    SELECT
      p.id AS user_id,
      COALESCE(SUM(e.amount_paid), 0) AS academy_revenue,
      MAX(CASE WHEN fs.id IS NOT NULL THEN 1 ELSE 0 END) AS has_family,
      -- Family : on estime la LTV cumulee par months_active * monthly_price.
      -- months_active = nb de mois entre created_at et current_period_end (ou NOW si actif).
      COALESCE(SUM(
        CASE
          WHEN fs.id IS NULL THEN 0
          ELSE
            GREATEST(1,
              EXTRACT(YEAR FROM AGE(
                LEAST(COALESCE(fs.current_period_end, NOW()), NOW()),
                fs.created_at
              )) * 12 +
              EXTRACT(MONTH FROM AGE(
                LEAST(COALESCE(fs.current_period_end, NOW()), NOW()),
                fs.created_at
              ))
            ) * (CASE WHEN fs.plan = 'fondateur' THEN 1900 ELSE 2900 END)
        END
      ), 0) AS family_revenue
    FROM public.profiles p
    LEFT JOIN public.enrollments e ON e.user_id = p.id AND e.status = 'active'
    LEFT JOIN public.family_subscriptions fs ON fs.user_id = p.id
    GROUP BY p.id
  ),
  classified AS (
    SELECT
      CASE
        WHEN academy_revenue > 0 AND has_family = 1 THEN 'both'
        WHEN academy_revenue > 0 THEN 'academy_only'
        WHEN has_family = 1 THEN 'family_only'
        ELSE 'no_purchase'
      END AS segment,
      (academy_revenue + family_revenue) AS revenue
    FROM per_user
  )
  SELECT
    segment,
    COUNT(*)::BIGINT AS customers_count,
    SUM(revenue)::BIGINT AS total_revenue_cents,
    CASE WHEN COUNT(*) > 0 THEN (SUM(revenue) / COUNT(*))::BIGINT ELSE 0 END AS avg_ltv_cents
  FROM classified
  WHERE segment <> 'no_purchase'
  GROUP BY segment
  ORDER BY avg_ltv_cents DESC;
$$;

GRANT EXECUTE ON FUNCTION public.customer_ltv() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Cohortes de conversion : par mois d'entree CRM, % devenus clients
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.conversion_cohorts(months_back INT DEFAULT 6)
RETURNS TABLE (
  cohort_month DATE,
  contacts_count BIGINT,
  converted_count BIGINT,
  conversion_rate NUMERIC,
  avg_days_to_convert NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH cohorts AS (
    SELECT
      c.id AS contact_id,
      c.email,
      date_trunc('month', c.subscribed_at)::DATE AS cohort_month,
      c.subscribed_at,
      MIN(e.purchased_at) AS first_purchase_at
    FROM public.contacts c
    LEFT JOIN public.profiles p ON LOWER(p.email) = LOWER(c.email)
    LEFT JOIN public.enrollments e ON e.user_id = p.id AND e.status = 'active'
    WHERE c.subscribed_at >= date_trunc('month', NOW()) - (months_back || ' months')::interval
    GROUP BY c.id, c.email, cohort_month, c.subscribed_at
  )
  SELECT
    cohort_month,
    COUNT(*)::BIGINT AS contacts_count,
    COUNT(*) FILTER (WHERE first_purchase_at IS NOT NULL)::BIGINT AS converted_count,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND(100.0 * COUNT(*) FILTER (WHERE first_purchase_at IS NOT NULL) / COUNT(*), 1)
      ELSE 0
    END AS conversion_rate,
    ROUND(AVG(EXTRACT(EPOCH FROM (first_purchase_at - subscribed_at)) / 86400)
          FILTER (WHERE first_purchase_at IS NOT NULL)::numeric, 1) AS avg_days_to_convert
  FROM cohorts
  GROUP BY cohort_month
  ORDER BY cohort_month DESC;
$$;

GRANT EXECUTE ON FUNCTION public.conversion_cohorts(INT) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Funnel par lead magnet : opt-ins -> achats Academy
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lead_magnet_funnel(period_days INT DEFAULT 90)
RETURNS TABLE (
  lead_magnet_slug TEXT,
  lead_magnet_name TEXT,
  opt_ins BIGINT,
  buyers BIGINT,
  conversion_rate NUMERIC,
  revenue_cents BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH lm AS (
    SELECT slug, name FROM public.lead_magnets
  ),
  opted_in AS (
    SELECT
      lm.slug,
      lm.name,
      c.id AS contact_id,
      LOWER(c.email) AS email
    FROM lm
    JOIN public.contacts c
      ON ('lm:' || lm.slug) = ANY(c.tags)
     AND c.subscribed_at >= NOW() - (period_days || ' days')::interval
  ),
  with_purchase AS (
    SELECT
      o.slug,
      o.email,
      MIN(e.amount_paid) AS amount_paid
    FROM opted_in o
    LEFT JOIN public.profiles p ON LOWER(p.email) = o.email
    LEFT JOIN public.enrollments e ON e.user_id = p.id AND e.status = 'active'
    GROUP BY o.slug, o.email
  )
  SELECT
    o.slug AS lead_magnet_slug,
    MAX(o.name) AS lead_magnet_name,
    COUNT(DISTINCT o.email)::BIGINT AS opt_ins,
    COUNT(DISTINCT wp.email) FILTER (WHERE wp.amount_paid IS NOT NULL)::BIGINT AS buyers,
    CASE
      WHEN COUNT(DISTINCT o.email) > 0 THEN
        ROUND(100.0 * COUNT(DISTINCT wp.email) FILTER (WHERE wp.amount_paid IS NOT NULL)
              / COUNT(DISTINCT o.email), 1)
      ELSE 0
    END AS conversion_rate,
    COALESCE(SUM(wp.amount_paid) FILTER (WHERE wp.amount_paid IS NOT NULL), 0)::BIGINT AS revenue_cents
  FROM opted_in o
  LEFT JOIN with_purchase wp ON wp.slug = o.slug AND wp.email = o.email
  GROUP BY o.slug
  ORDER BY revenue_cents DESC, opt_ins DESC;
$$;

GRANT EXECUTE ON FUNCTION public.lead_magnet_funnel(INT) TO authenticated, service_role;
