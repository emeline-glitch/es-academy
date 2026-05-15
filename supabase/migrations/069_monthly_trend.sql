-- 069_monthly_trend : tendance mensuelle des KPIs business sur N mois.
--
-- Repond a "comment evolue mon business dans le temps ?". Permet de
-- voir d'un coup d'oeil :
--   - Saisonnalite (creux d'ete vs pic rentree par exemple)
--   - Tendance generale (croissance vs decroissance)
--   - Mois exceptionnels a comprendre
--
-- Genere une serie continue : meme les mois sans aucune activite
-- apparaissent avec des zeros (sinon le graphique a des trous).

CREATE OR REPLACE FUNCTION public.monthly_trend(months_back INT DEFAULT 12)
RETURNS TABLE (
  month DATE,
  revenue_cents BIGINT,
  sales_count BIGINT,
  contacts_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', NOW()) - ((months_back - 1) || ' months')::interval,
      date_trunc('month', NOW()),
      '1 month'::interval
    )::date AS month
  ),
  enrollments_per_month AS (
    SELECT
      date_trunc('month', purchased_at)::date AS month,
      COALESCE(SUM(amount_paid), 0)::BIGINT AS revenue_cents,
      COUNT(*)::BIGINT AS sales_count
    FROM public.enrollments
    WHERE status = 'active'
      AND purchased_at >= date_trunc('month', NOW()) - ((months_back - 1) || ' months')::interval
    GROUP BY date_trunc('month', purchased_at)::date
  ),
  contacts_per_month AS (
    SELECT
      date_trunc('month', subscribed_at)::date AS month,
      COUNT(*)::BIGINT AS contacts_count
    FROM public.contacts
    WHERE subscribed_at >= date_trunc('month', NOW()) - ((months_back - 1) || ' months')::interval
    GROUP BY date_trunc('month', subscribed_at)::date
  )
  SELECT
    m.month,
    COALESCE(e.revenue_cents, 0)::BIGINT,
    COALESCE(e.sales_count, 0)::BIGINT,
    COALESCE(c.contacts_count, 0)::BIGINT
  FROM months m
  LEFT JOIN enrollments_per_month e ON e.month = m.month
  LEFT JOIN contacts_per_month c ON c.month = m.month
  ORDER BY m.month;
$$;

REVOKE EXECUTE ON FUNCTION public.monthly_trend(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.monthly_trend(INT) TO authenticated, service_role;
