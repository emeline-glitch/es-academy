-- 081_weekly_digest_cron : schedule du digest hebdomadaire Emeline.
--
-- Cron : tous les lundis a 7h UTC (= 8-9h Paris selon saison ete/hiver).
-- Endpoint : /api/cron/weekly-digest qui build et send l'email digest.

DO $$
DECLARE
  v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret'
  LIMIT 1;

  IF v_secret IS NULL THEN
    RAISE WARNING '[migration 081] vault cron_secret absent, weekly-digest cron non programme';
    RETURN;
  END IF;

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'es-academy-weekly-digest';

  PERFORM cron.schedule(
    'es-academy-weekly-digest',
    '0 7 * * 1',  -- lundi 7h UTC = 9h Paris ete / 8h Paris hiver
    format($job$
      SELECT net.http_post(
        url := 'https://emeline-siron.fr/api/cron/weekly-digest',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      );
    $job$, v_secret)
  );
END $$;
