-- 070_finance_summary : page Finance privee Emeline.
--
-- Table finance_targets : objectifs annuels (Emeline fixe en debut d'annee).
-- RPC finance_summary : recap complet pour la page /admin/finance :
--   - MRR Family + ARR projete
--   - CA mois courant, trimestre courant, annee courante (TTC + HT)
--   - CA annee precedente pour comparaison YoY
--   - Objectif annuel + progression
--   - Repartition Academy / Family / Coaching

CREATE TABLE IF NOT EXISTS public.finance_targets (
  year INT PRIMARY KEY,
  annual_target_cents BIGINT NOT NULL,
  q1_target_cents BIGINT,
  q2_target_cents BIGINT,
  q3_target_cents BIGINT,
  q4_target_cents BIGINT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.finance_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finance_targets service write"
  ON public.finance_targets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed 2026 a 100K€ HT objectif (modifiable apres depuis /admin/finance).
INSERT INTO public.finance_targets (year, annual_target_cents, notes)
VALUES (2026, 10000000, 'Objectif initial post-lancement Academy mi-mai 2026')
ON CONFLICT (year) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RPC finance_summary : tout en un seul call pour la page Finance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finance_summary()
RETURNS TABLE (
  -- Periodes courantes
  month_ttc_cents BIGINT,
  quarter_ttc_cents BIGINT,
  year_ttc_cents BIGINT,
  prev_year_ttc_cents BIGINT,
  -- HT (TVA 20%, calcule cote SQL pour eviter approximation cote client)
  year_ht_cents BIGINT,
  -- MRR Family
  family_mrr_cents BIGINT,
  family_arr_cents BIGINT,
  -- Repartition par produit (annee en cours)
  academy_year_cents BIGINT,
  family_year_cents BIGINT,
  -- Objectif annee en cours
  annual_target_cents BIGINT,
  target_progress_pct NUMERIC,
  -- Quarter info
  current_quarter INT,
  current_year INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
  bounds AS (
    SELECT
      date_trunc('month', NOW()) AS month_start,
      date_trunc('quarter', NOW()) AS quarter_start,
      date_trunc('year', NOW()) AS year_start,
      date_trunc('year', NOW()) - INTERVAL '1 year' AS prev_year_start,
      date_trunc('year', NOW()) AS prev_year_end,
      EXTRACT(YEAR FROM NOW())::INT AS current_year,
      EXTRACT(QUARTER FROM NOW())::INT AS current_quarter
  ),
  academy_revenues AS (
    SELECT
      COALESCE(SUM(amount_paid) FILTER (WHERE purchased_at >= (SELECT month_start FROM bounds)), 0)::BIGINT AS month_cents,
      COALESCE(SUM(amount_paid) FILTER (WHERE purchased_at >= (SELECT quarter_start FROM bounds)), 0)::BIGINT AS quarter_cents,
      COALESCE(SUM(amount_paid) FILTER (WHERE purchased_at >= (SELECT year_start FROM bounds)), 0)::BIGINT AS year_cents,
      COALESCE(SUM(amount_paid) FILTER (
        WHERE purchased_at >= (SELECT prev_year_start FROM bounds)
          AND purchased_at < (SELECT prev_year_end FROM bounds)
      ), 0)::BIGINT AS prev_year_cents
    FROM public.enrollments
    WHERE status = 'active'
  ),
  family_active AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'active' AND plan = 'fondateur') AS fondateur_count,
      COUNT(*) FILTER (WHERE status = 'active' AND plan = 'standard') AS standard_count
    FROM public.family_subscriptions
  ),
  family_calc AS (
    SELECT
      (fondateur_count * 1900 + standard_count * 2900)::BIGINT AS mrr_cents
    FROM family_active
  ),
  -- CA Family annee en cours : estimation = MRR * nb mois actifs depuis
  -- debut annee pour chaque sub. Approximation : nb_mois * monthly_price.
  family_year AS (
    SELECT
      COALESCE(SUM(
        GREATEST(1,
          EXTRACT(YEAR FROM AGE(
            LEAST(COALESCE(current_period_end, NOW()), NOW()),
            GREATEST(created_at, (SELECT year_start FROM bounds))
          )) * 12 +
          EXTRACT(MONTH FROM AGE(
            LEAST(COALESCE(current_period_end, NOW()), NOW()),
            GREATEST(created_at, (SELECT year_start FROM bounds))
          ))
        ) * (CASE WHEN plan = 'fondateur' THEN 1900 ELSE 2900 END)
      ), 0)::BIGINT AS revenue_cents
    FROM public.family_subscriptions
    WHERE created_at < NOW()
  ),
  target AS (
    SELECT annual_target_cents
    FROM public.finance_targets
    WHERE year = (SELECT current_year FROM bounds)
  )
  SELECT
    ar.month_cents AS month_ttc_cents,
    ar.quarter_cents AS quarter_ttc_cents,
    (ar.year_cents + fy.revenue_cents)::BIGINT AS year_ttc_cents,
    ar.prev_year_cents AS prev_year_ttc_cents,
    -- HT = floor(ttc / 1.20)
    FLOOR((ar.year_cents + fy.revenue_cents) / 1.20)::BIGINT AS year_ht_cents,
    fc.mrr_cents AS family_mrr_cents,
    (fc.mrr_cents * 12)::BIGINT AS family_arr_cents,
    ar.year_cents AS academy_year_cents,
    fy.revenue_cents AS family_year_cents,
    COALESCE(t.annual_target_cents, 0)::BIGINT AS annual_target_cents,
    CASE
      WHEN COALESCE(t.annual_target_cents, 0) > 0 THEN
        ROUND(100.0 * (ar.year_cents + fy.revenue_cents) / t.annual_target_cents, 1)
      ELSE 0
    END AS target_progress_pct,
    (SELECT current_quarter FROM bounds)::INT,
    (SELECT current_year FROM bounds)::INT
  FROM academy_revenues ar
  CROSS JOIN family_calc fc
  CROSS JOIN family_year fy
  LEFT JOIN target t ON true;
$$;

REVOKE EXECUTE ON FUNCTION public.finance_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finance_summary() TO authenticated, service_role;
