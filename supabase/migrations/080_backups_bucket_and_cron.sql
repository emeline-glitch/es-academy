-- 080_backups_bucket_and_cron : bucket Storage prive pour les backups DB
-- + cron quotidien qui appelle /api/cron/backup-db.
--
-- Strategie : un job tous les jours a 4h UTC (6h Paris ete) qui exporte
-- les tables critiques en JSON gzippe vers un bucket Supabase Storage
-- "backups" prive (RLS service_role only). Retention 30 jours pilotee
-- cote endpoint (suppression auto des fichiers > 30j).
--
-- Tables critiques exportees :
--   - contacts (CRM data)
--   - enrollments (achats Academy/Family)
--   - family_subscriptions (abos recurrents)
--   - audit_log (preuves CNIL)
--   - consent_log (preuves RGPD)
--   - email_sequences, email_sequence_steps, email_sequence_enrollments
--   - contact_lists (segmentation)
--   - email_templates (templates editables)
--   - finance_expenses, finance_targets
--   - profiles (eleves auth + role)
--   - anomaly_alerts (historique monitoring)
--
-- Restore : node scripts/restore-backup.mjs <date>
-- (cree dans une PR ulterieure si besoin de rollback)

-- 1. Cree le bucket "backups" prive si pas deja la
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS : seul service_role peut lire/ecrire (deja par defaut sur bucket prive
--    mais on ajoute une policy explicite pour bypass le bug Supabase ou les
--    buckets prives sont parfois accessibles via signed URL anonymous).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'backups_service_role_all'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY "backups_service_role_all"
        ON storage.objects FOR ALL
        TO service_role
        USING (bucket_id = 'backups')
        WITH CHECK (bucket_id = 'backups');
    $POL$;
  END IF;
END $$;

-- 3. Cron : 1x/jour a 4h UTC
DO $$
DECLARE
  v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret'
  LIMIT 1;

  IF v_secret IS NULL THEN
    RAISE WARNING '[migration 080] vault cron_secret absent, backup cron non programme';
    RETURN;
  END IF;

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'es-academy-backup-db';

  PERFORM cron.schedule(
    'es-academy-backup-db',
    '0 4 * * *',
    format($job$
      SELECT net.http_post(
        url := 'https://emeline-siron.fr/api/cron/backup-db',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 300000
      );
    $job$, v_secret)
  );
END $$;
