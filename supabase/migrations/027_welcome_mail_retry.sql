-- Sprint Stripe Phase 1 : retry mail de bienvenue Academy si SES fail
-- Sans ça, un client paye 998€ mais ne reçoit jamais son code Family si SES rejette (DKIM, sandbox, rate limit).

-- ============================================================================
-- Colonnes de tracking sur enrollments
-- ============================================================================

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS family_gift_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS family_gift_email_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS family_gift_email_last_error TEXT,
  ADD COLUMN IF NOT EXISTS family_gift_email_last_attempt_at TIMESTAMPTZ;

-- Index partiel : ne picke que les rows que le cron doit retraiter (généré, pas envoyé, attempts < 3)
CREATE INDEX IF NOT EXISTS idx_enrollments_welcome_pending
  ON public.enrollments(family_gift_generated_at)
  WHERE family_gift_email_sent_at IS NULL
    AND family_gift_generated_at IS NOT NULL
    AND family_gift_email_attempts < 3;

-- ============================================================================
-- RPC record_academy_welcome_email_send
-- UPDATE atomique pour éviter les race conditions entre webhook et cron retry.
-- p_success=true  : marque sent_at + incrémente attempts + clear last_error
-- p_success=false : incrémente attempts + set last_error + last_attempt_at
-- Renvoie le nouveau nombre de tentatives pour que le caller décide d'alerter (>= 3).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_academy_welcome_email_send(
  p_enrollment_id UUID,
  p_success BOOLEAN,
  p_error_msg TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  IF p_success THEN
    UPDATE public.enrollments
    SET
      family_gift_email_sent_at = now(),
      family_gift_email_attempts = family_gift_email_attempts + 1,
      family_gift_email_last_error = NULL,
      family_gift_email_last_attempt_at = now()
    WHERE id = p_enrollment_id
    RETURNING family_gift_email_attempts INTO v_attempts;
  ELSE
    UPDATE public.enrollments
    SET
      family_gift_email_attempts = family_gift_email_attempts + 1,
      family_gift_email_last_error = left(coalesce(p_error_msg, 'unknown'), 1000),
      family_gift_email_last_attempt_at = now()
    WHERE id = p_enrollment_id
    RETURNING family_gift_email_attempts INTO v_attempts;
  END IF;

  RETURN coalesce(v_attempts, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_academy_welcome_email_send(UUID, BOOLEAN, TEXT) TO service_role;

-- ============================================================================
-- RPC academy_welcome_email_pending : liste les enrollments à retraiter
-- Filtre : généré il y a > 5 min (laisse le webhook initial finir), < 3 tentatives.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.academy_welcome_email_pending(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  enrollment_id UUID,
  user_id UUID,
  family_gift_code TEXT,
  installments INTEGER,
  attempts INTEGER,
  generated_at TIMESTAMPTZ,
  email TEXT,
  full_name TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.id AS enrollment_id,
    e.user_id,
    e.family_gift_code,
    e.installments,
    e.family_gift_email_attempts AS attempts,
    e.family_gift_generated_at AS generated_at,
    p.email,
    p.full_name
  FROM public.enrollments e
  JOIN public.profiles p ON p.id = e.user_id
  WHERE e.family_gift_email_sent_at IS NULL
    AND e.family_gift_generated_at IS NOT NULL
    AND e.family_gift_generated_at < now() - INTERVAL '5 minutes'
    AND e.family_gift_email_attempts < 3
    AND e.family_gift_code IS NOT NULL
  ORDER BY e.family_gift_generated_at ASC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.academy_welcome_email_pending(INTEGER) TO service_role;

-- ============================================================================
-- RPC academy_welcome_email_failed_count : pour la carte alerte sur dashboard admin
-- Compte les enrollments à >= 3 tentatives sans envoi réussi (give-up nécessite intervention manuelle)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.academy_welcome_email_failed_count()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT count(*)
  FROM public.enrollments
  WHERE family_gift_email_sent_at IS NULL
    AND family_gift_generated_at IS NOT NULL
    AND family_gift_email_attempts >= 3;
$$;

GRANT EXECUTE ON FUNCTION public.academy_welcome_email_failed_count() TO authenticated, service_role;

-- ============================================================================
-- Job pg_cron : retry toutes les 10 min
-- Appelle /api/cron/retry-academy-welcome-mail (créé dans le même PR)
-- ============================================================================

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'es-academy-retry-welcome-mail';

-- Décalé de 5 min vs 'es-academy-process-sequences' (qui tourne aussi */10)
-- pour éviter de saturer SES en cas de gros volume simultané.
SELECT cron.schedule(
  'es-academy-retry-welcome-mail',
  '5,15,25,35,45,55 * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/retry-academy-welcome-mail',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer bk3JTO7WwsoTRAnUuVYTUZ5kwCV15IYEqF_BwbrOI2U'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);
