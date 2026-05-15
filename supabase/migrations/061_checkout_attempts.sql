-- 061_checkout_attempts : track les sessions Stripe Checkout creees pour
-- mesurer l'abandon de panier.
--
-- Aujourd'hui : un user clique "Acheter", on cree une session Stripe et on
-- redirige. Si il ne paie pas, on n'a aucune trace. Impossible de savoir
-- combien de checkouts sont abandonnes ni de relancer.
--
-- Modele :
-- - Insert au moment de la creation de session checkout (status='pending')
-- - Update via webhook checkout.session.completed -> status='completed'
-- - Update via webhook checkout.session.expired -> status='expired'
-- - Une row par session Stripe (UNIQUE stripe_session_id)

CREATE TABLE IF NOT EXISTS public.checkout_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT NOT NULL UNIQUE,
  product TEXT NOT NULL CHECK (product IN ('academy', 'family')),
  plan TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'abandoned')),
  amount_cents INT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  cta_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_checkout_attempts_status_created ON public.checkout_attempts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkout_attempts_email ON public.checkout_attempts(LOWER(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checkout_attempts_product ON public.checkout_attempts(product, status);

ALTER TABLE public.checkout_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkout_attempts service write"
  ON public.checkout_attempts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- RPC : stats abandon de panier (30j par defaut)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.checkout_abandonment_stats(period_days INT DEFAULT 30)
RETURNS TABLE (
  total_attempts BIGINT,
  completed_count BIGINT,
  abandoned_count BIGINT,
  pending_recent BIGINT,
  expired_count BIGINT,
  completion_rate NUMERIC,
  potential_revenue_cents BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH period AS (
    SELECT *
    FROM public.checkout_attempts
    WHERE created_at >= NOW() - (period_days || ' days')::interval
  )
  SELECT
    COUNT(*)::BIGINT AS total_attempts,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS completed_count,
    -- Abandoned : pending depuis >24h sans completion OU expired explicite.
    -- Stripe Checkout sessions expirent par defaut apres 24h.
    COUNT(*) FILTER (
      WHERE status IN ('expired', 'abandoned')
        OR (status = 'pending' AND created_at < NOW() - INTERVAL '24 hours')
    )::BIGINT AS abandoned_count,
    -- Pending recent (<24h) = en cours, pas encore abandonne
    COUNT(*) FILTER (WHERE status = 'pending' AND created_at >= NOW() - INTERVAL '24 hours')::BIGINT AS pending_recent,
    COUNT(*) FILTER (WHERE status = 'expired')::BIGINT AS expired_count,
    CASE
      WHEN COUNT(*) FILTER (WHERE status <> 'pending' OR created_at < NOW() - INTERVAL '24 hours') > 0 THEN
        ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed')
              / NULLIF(COUNT(*) FILTER (WHERE status <> 'pending' OR created_at < NOW() - INTERVAL '24 hours'), 0), 1)
      ELSE 0
    END AS completion_rate,
    COALESCE(SUM(amount_cents) FILTER (
      WHERE status IN ('expired', 'abandoned')
        OR (status = 'pending' AND created_at < NOW() - INTERVAL '24 hours')
    ), 0)::BIGINT AS potential_revenue_cents
  FROM period;
$$;

GRANT EXECUTE ON FUNCTION public.checkout_abandonment_stats(INT) TO authenticated, service_role;
