-- 072_finance_expenses : charges fixes pour le calcul de la marge nette.
--
-- Modele simple : 1 ligne = 1 poste de depense (label, categorie, montant).
-- is_recurring_monthly=true (defaut) -> multiplier par 12 pour le total
-- annuel. is_recurring_monthly=false -> charge one-shot, comptee 1 fois.
--
-- Pas de notion fine de start/end_month pour cette V1 : Emeline peut juste
-- supprimer une ligne quand le contrat s'arrete. On affinera si besoin.

CREATE TABLE IF NOT EXISTS public.finance_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Autres',
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  is_recurring_monthly BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_expenses_category ON public.finance_expenses(category);

ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finance_expenses service write"
  ON public.finance_expenses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Etend finance_summary pour retourner aussi le total charges + marge nette.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.finance_summary();

CREATE OR REPLACE FUNCTION public.finance_summary()
RETURNS TABLE (
  month_ttc_cents BIGINT,
  quarter_ttc_cents BIGINT,
  year_ttc_cents BIGINT,
  prev_year_ttc_cents BIGINT,
  year_ht_cents BIGINT,
  family_mrr_cents BIGINT,
  family_arr_cents BIGINT,
  academy_year_cents BIGINT,
  family_year_cents BIGINT,
  annual_target_cents BIGINT,
  target_progress_pct NUMERIC,
  q1_target_cents BIGINT,
  q1_realised_cents BIGINT,
  q2_target_cents BIGINT,
  q2_realised_cents BIGINT,
  q3_target_cents BIGINT,
  q3_realised_cents BIGINT,
  q4_target_cents BIGINT,
  q4_realised_cents BIGINT,
  -- Nouveau : charges + marge
  monthly_expenses_cents BIGINT,
  annual_expenses_cents BIGINT,
  net_margin_year_cents BIGINT,
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
      EXTRACT(QUARTER FROM NOW())::INT AS current_quarter,
      date_trunc('year', NOW()) AS q1_start,
      date_trunc('year', NOW()) + INTERVAL '3 months' AS q2_start,
      date_trunc('year', NOW()) + INTERVAL '6 months' AS q3_start,
      date_trunc('year', NOW()) + INTERVAL '9 months' AS q4_start,
      date_trunc('year', NOW()) + INTERVAL '1 year' AS next_year_start
  ),
  academy_revenues AS (
    SELECT
      COALESCE(SUM(amount_paid) FILTER (WHERE purchased_at >= (SELECT month_start FROM bounds)), 0)::BIGINT AS month_cents,
      COALESCE(SUM(amount_paid) FILTER (WHERE purchased_at >= (SELECT quarter_start FROM bounds)), 0)::BIGINT AS quarter_cents,
      COALESCE(SUM(amount_paid) FILTER (WHERE purchased_at >= (SELECT year_start FROM bounds)), 0)::BIGINT AS year_cents,
      COALESCE(SUM(amount_paid) FILTER (
        WHERE purchased_at >= (SELECT prev_year_start FROM bounds)
          AND purchased_at < (SELECT prev_year_end FROM bounds)
      ), 0)::BIGINT AS prev_year_cents,
      COALESCE(SUM(amount_paid) FILTER (
        WHERE purchased_at >= (SELECT q1_start FROM bounds)
          AND purchased_at < (SELECT q2_start FROM bounds)
      ), 0)::BIGINT AS q1_cents,
      COALESCE(SUM(amount_paid) FILTER (
        WHERE purchased_at >= (SELECT q2_start FROM bounds)
          AND purchased_at < (SELECT q3_start FROM bounds)
      ), 0)::BIGINT AS q2_cents,
      COALESCE(SUM(amount_paid) FILTER (
        WHERE purchased_at >= (SELECT q3_start FROM bounds)
          AND purchased_at < (SELECT q4_start FROM bounds)
      ), 0)::BIGINT AS q3_cents,
      COALESCE(SUM(amount_paid) FILTER (
        WHERE purchased_at >= (SELECT q4_start FROM bounds)
          AND purchased_at < (SELECT next_year_start FROM bounds)
      ), 0)::BIGINT AS q4_cents
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
    SELECT annual_target_cents, q1_target_cents, q2_target_cents, q3_target_cents, q4_target_cents
    FROM public.finance_targets
    WHERE year = (SELECT current_year FROM bounds)
  ),
  expenses AS (
    SELECT
      COALESCE(SUM(amount_cents) FILTER (WHERE is_recurring_monthly), 0)::BIGINT AS monthly_recurring_cents,
      COALESCE(SUM(amount_cents) FILTER (WHERE NOT is_recurring_monthly), 0)::BIGINT AS one_shot_cents
    FROM public.finance_expenses
  )
  SELECT
    ar.month_cents AS month_ttc_cents,
    ar.quarter_cents AS quarter_ttc_cents,
    (ar.year_cents + fy.revenue_cents)::BIGINT AS year_ttc_cents,
    ar.prev_year_cents AS prev_year_ttc_cents,
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
    COALESCE(t.q1_target_cents, t.annual_target_cents / 4, 0)::BIGINT AS q1_target_cents,
    ar.q1_cents AS q1_realised_cents,
    COALESCE(t.q2_target_cents, t.annual_target_cents / 4, 0)::BIGINT AS q2_target_cents,
    ar.q2_cents AS q2_realised_cents,
    COALESCE(t.q3_target_cents, t.annual_target_cents / 4, 0)::BIGINT AS q3_target_cents,
    ar.q3_cents AS q3_realised_cents,
    COALESCE(t.q4_target_cents, t.annual_target_cents / 4, 0)::BIGINT AS q4_target_cents,
    ar.q4_cents AS q4_realised_cents,
    e.monthly_recurring_cents AS monthly_expenses_cents,
    (e.monthly_recurring_cents * 12 + e.one_shot_cents)::BIGINT AS annual_expenses_cents,
    -- Marge nette annuelle = CA HT - charges annuelles
    (FLOOR((ar.year_cents + fy.revenue_cents) / 1.20) - (e.monthly_recurring_cents * 12 + e.one_shot_cents))::BIGINT AS net_margin_year_cents,
    (SELECT current_quarter FROM bounds)::INT,
    (SELECT current_year FROM bounds)::INT
  FROM academy_revenues ar
  CROSS JOIN family_calc fc
  CROSS JOIN family_year fy
  CROSS JOIN expenses e
  LEFT JOIN target t ON true;
$$;

REVOKE EXECUTE ON FUNCTION public.finance_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finance_summary() TO authenticated, service_role;
