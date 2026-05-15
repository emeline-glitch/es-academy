-- 058_dashboard_quick_wins : 4 nouvelles RPC pour les quick wins Lot C.
--
-- 1. dashboard_stats_previous_month : meme structure que dashboard_stats mais
--    sur le mois precedent, pour calculer le delta M-1 visible sur chaque KPI.
-- 2. pipeline_velocity : temps moyen entre subscribed_at et pipeline_stage="gagne".
--    Proxy en attendant une table d'historique des stages. Donne quand meme
--    une indication de la vitesse globale de conversion.
-- 3. dunning_alert : compte les abos Family en past_due/unpaid (echec paiement).
--    Pour Academy 3x/4x, info disponible sur la fiche eleve mais pas agregee.
--    Premier jalon : si > 0, alerte rouge dashboard.
-- 4. coaching_upsell_candidates : eleves qui ont consomme tous leurs credits
--    coaching. Lead potentiel pour upsell coaching seul.

-- ---------------------------------------------------------------------------
-- 1. CA + ventes + contacts du mois precedent
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dashboard_previous_month()
RETURNS TABLE (
  prev_month_revenue BIGINT,
  prev_month_sales_count BIGINT,
  prev_month_contacts BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      date_trunc('month', NOW()) - INTERVAL '1 month' AS prev_start,
      date_trunc('month', NOW()) AS prev_end
  )
  SELECT
    COALESCE((
      SELECT SUM(amount_paid)
      FROM public.enrollments e, bounds b
      WHERE e.purchased_at >= b.prev_start AND e.purchased_at < b.prev_end
    ), 0)::BIGINT AS prev_month_revenue,
    COALESCE((
      SELECT COUNT(*)
      FROM public.enrollments e, bounds b
      WHERE e.purchased_at >= b.prev_start AND e.purchased_at < b.prev_end
    ), 0)::BIGINT AS prev_month_sales_count,
    COALESCE((
      SELECT COUNT(*)
      FROM public.contacts c, bounds b
      WHERE c.subscribed_at >= b.prev_start AND c.subscribed_at < b.prev_end
    ), 0)::BIGINT AS prev_month_contacts;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_previous_month() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Velocity pipeline : temps moyen lead -> gagne (en jours)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pipeline_velocity()
RETURNS TABLE (
  pipeline TEXT,
  avg_days NUMERIC,
  median_days NUMERIC,
  total_won BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Academy : pipeline_stage='gagne'
  SELECT
    'academy'::TEXT AS pipeline,
    ROUND(AVG(EXTRACT(EPOCH FROM (pipeline_updated_at - subscribed_at)) / 86400)::numeric, 1) AS avg_days,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (pipeline_updated_at - subscribed_at)) / 86400)::numeric, 1) AS median_days,
    COUNT(*)::BIGINT AS total_won
  FROM public.contacts
  WHERE pipeline_stage = 'gagne'
    AND pipeline_updated_at IS NOT NULL
    AND subscribed_at IS NOT NULL

  UNION ALL

  -- Family : pipeline_family_stage='membre_payant'
  SELECT
    'family'::TEXT AS pipeline,
    ROUND(AVG(EXTRACT(EPOCH FROM (pipeline_family_updated_at - subscribed_at)) / 86400)::numeric, 1) AS avg_days,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (pipeline_family_updated_at - subscribed_at)) / 86400)::numeric, 1) AS median_days,
    COUNT(*)::BIGINT AS total_won
  FROM public.contacts
  WHERE pipeline_family_stage = 'membre_payant'
    AND pipeline_family_updated_at IS NOT NULL
    AND subscribed_at IS NOT NULL

  UNION ALL

  -- Custom : pipeline_custom_stage='termine'
  SELECT
    'custom'::TEXT AS pipeline,
    ROUND(AVG(EXTRACT(EPOCH FROM (pipeline_custom_updated_at - subscribed_at)) / 86400)::numeric, 1) AS avg_days,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (pipeline_custom_updated_at - subscribed_at)) / 86400)::numeric, 1) AS median_days,
    COUNT(*)::BIGINT AS total_won
  FROM public.contacts
  WHERE pipeline_custom_stage IN ('accepte', 'en_cours', 'termine')
    AND pipeline_custom_updated_at IS NOT NULL
    AND subscribed_at IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.pipeline_velocity() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Dunning alert : abos Family en echec paiement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dunning_alert()
RETURNS TABLE (
  past_due_count BIGINT,
  unpaid_count BIGINT,
  total_alert BIGINT,
  affected_mrr_cents BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'past_due')::BIGINT AS past_due_count,
    COUNT(*) FILTER (WHERE status = 'unpaid')::BIGINT AS unpaid_count,
    COUNT(*) FILTER (WHERE status IN ('past_due', 'unpaid'))::BIGINT AS total_alert,
    (
      COUNT(*) FILTER (WHERE status IN ('past_due', 'unpaid') AND plan = 'fondateur') * 1900 +
      COUNT(*) FILTER (WHERE status IN ('past_due', 'unpaid') AND plan = 'standard') * 2900
    )::BIGINT AS affected_mrr_cents
  FROM public.family_subscriptions;
$$;

GRANT EXECUTE ON FUNCTION public.dunning_alert() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Coaching upsell candidates : eleves ayant consomme tous leurs credits
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.coaching_upsell_candidates()
RETURNS TABLE (
  exhausted_count BIGINT,
  near_exhausted_count BIGINT,
  total_active_credits BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- A consomme TOUS ses credits (credits_used >= credits_total ET credits_total > 0)
    COUNT(*) FILTER (
      WHERE coaching_credits_total > 0
        AND coaching_credits_used >= coaching_credits_total
    )::BIGINT AS exhausted_count,
    -- Proche : >= 75% mais pas encore tous consommes
    COUNT(*) FILTER (
      WHERE coaching_credits_total > 0
        AND coaching_credits_used < coaching_credits_total
        AND coaching_credits_used::float / NULLIF(coaching_credits_total, 0) >= 0.75
    )::BIGINT AS near_exhausted_count,
    SUM(coaching_credits_total - coaching_credits_used)::BIGINT AS total_active_credits
  FROM public.profiles
  WHERE coaching_credits_total > 0;
$$;

GRANT EXECUTE ON FUNCTION public.coaching_upsell_candidates() TO authenticated, service_role;
