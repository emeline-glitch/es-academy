-- Migration 052 : Healthcheck cron quotidien
--
-- Contexte (AUDIT_STRESS_TEST_V2.md N3) : pas de monitoring uptime avant M8.
-- Filet temporaire : ping quotidien des services critiques (Supabase, Stripe,
-- Notion, SES) avec email recap a 8h Paris (6h UTC).
--
-- Si Emeline ne recoit pas le mail un matin, c'est qu'un des elements suivants
-- a casse : Vercel/pg_cron inactif, CRON_SECRET rotated mais vault pas a jour,
-- SES suppression list, reseau.
--
-- Le job lit le secret CRON_SECRET via vault.decrypted_secrets (cf. migration 046)
-- pour ne pas l'embarquer en clair dans cron.job.command.
--
-- Idempotent : unschedule avant re-create pour permettre re-execution propre.

-- ============================================================================
-- 1. Cleanup si re-run (idempotent)
-- ============================================================================

DO $$
BEGIN
  PERFORM cron.unschedule('es-academy-daily-healthcheck')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'es-academy-daily-healthcheck'
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ============================================================================
-- 2. Schedule du healthcheck : 6h UTC = 8h Paris
-- Timeout 60s : largement plus que les ~5s necessaires aux pings.
-- ============================================================================

SELECT cron.schedule(
  'es-academy-daily-healthcheck',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/daily-healthcheck',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- ============================================================================
-- 3. Verification
-- ============================================================================

SELECT jobid, schedule, jobname, active
FROM cron.job
WHERE jobname = 'es-academy-daily-healthcheck';
