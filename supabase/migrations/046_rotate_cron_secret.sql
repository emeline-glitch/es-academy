-- Migration 046 : Rotation du CRON_SECRET vers Supabase Vault + cron cleanup audit_log
--
-- Contexte sécurité (cf. SECURITY_INCIDENT_001.md) :
-- La migration 023_pg_cron_setup.sql (et 027, 035, 045_seo) embarquait le
-- CRON_SECRET en clair dans le corps des jobs pg_cron. Ce secret est donc
-- présent dans :
--   1. L'historique git du repo
--   2. La table cron.job de la DB (colonne command)
--   3. Le fichier de migration sur disque
--
-- Risque : un attaquant ayant accès à l'un de ces canaux peut spam-trigger
-- les endpoints /api/cron/* (DoS sur SES, envoi de mails non sollicités).
--
-- Cette migration :
--   1. Active l'extension supabase_vault (chiffrement au repos)
--   2. Re-schedule chaque cron job pour lire le secret via vault.decrypted_secrets
--   3. Ajoute le cron manquant cleanup-audit-log (RGPD : audit_log purge > 90j)
--
-- ÉTAPE MANUELLE OBLIGATOIRE AVANT EXÉCUTION :
-- Emeline doit insérer le nouveau secret via Supabase SQL Editor avec la commande :
--
--   SELECT vault.create_secret(
--     '<NOUVEAU_SECRET_CRON>',
--     'cron_secret',
--     'CRON_SECRET pour authentification des jobs pg_cron via /api/cron/*'
--   );
--
-- Si le secret existe déjà (rotation), utiliser à la place :
--
--   UPDATE vault.secrets
--   SET secret = '<NOUVEAU_SECRET_CRON>'
--   WHERE name = 'cron_secret';
--
-- Cette migration ne contient JAMAIS la valeur du secret en clair.

-- ============================================================================
-- 1. Active l'extension Vault (idempotent)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Sanity check : on s'attend à ce qu'Emeline ait inséré le secret avant.
-- Si manquant, on log un warning mais on continue (les jobs lèveront NULL Authorization).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'cron_secret'
  ) THEN
    RAISE WARNING '[migration 046] Le secret vault "cron_secret" est absent. Les cron jobs vont échouer avec 401. Insère le secret via SQL Studio puis relance les jobs.';
  END IF;
END $$;

-- ============================================================================
-- 2. Unschedule tous les jobs existants (rotation propre)
-- ============================================================================

DO $$
DECLARE
  v_jobname TEXT;
BEGIN
  FOR v_jobname IN
    SELECT jobname FROM cron.job
    WHERE jobname IN (
      'es-academy-process-sequences',
      'es-academy-detect-behavioral',
      'es-academy-chatel-reminders',
      'es-academy-retry-welcome-mail',
      'es-academy-seasonal-toggle',
      'es-academy-seo-audit',
      'es-academy-seo-pagespeed',
      'es-academy-cleanup-audit-log'
    )
  LOOP
    PERFORM cron.unschedule(v_jobname);
  END LOOP;
END $$;

-- ============================================================================
-- 3. Re-schedule chaque job en lisant le secret depuis Vault
-- ============================================================================

-- Job 1 : process-sequences */10 min
-- Picke les enrollments à envoyer et envoie via SES.
SELECT cron.schedule(
  'es-academy-process-sequences',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/process-sequences',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Job 2 : detect-behavioral-triggers toutes les 2h
-- Détecte multi-magnet, inactive-90, clicked-formation et auto-tag.
SELECT cron.schedule(
  'es-academy-detect-behavioral',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/detect-behavioral-triggers',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- Job 3 : chatel-reminders quotidien 6h UTC
-- Rappels J-15 et J-7 aux élèves Academy en trial ES Family.
SELECT cron.schedule(
  'es-academy-chatel-reminders',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/chatel-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- Job 4 : retry-academy-welcome-mail toutes les 10 min (décalé de 5 min)
-- Retry SES si webhook initial a échoué pour les paiements Academy.
SELECT cron.schedule(
  'es-academy-retry-welcome-mail',
  '5,15,25,35,45,55 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/retry-academy-welcome-mail',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Job 5 : seasonal-toggle quotidien 5h UTC
-- Active/désactive lead_magnets selon available_from/until (cahier vacances, calendrier avent, chasse oeufs).
SELECT cron.schedule(
  'es-academy-seasonal-toggle',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/seasonal-toggle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- Job 6 : seo-audit hebdomadaire lundi 5h UTC
-- Audit SEO complet (recos basées sur Notion + DB).
SELECT cron.schedule(
  'es-academy-seo-audit',
  '0 5 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/seo-audit',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- Job 7 : seo-pagespeed hebdomadaire lundi 6h UTC
-- PageSpeed Insights audit (Core Web Vitals), 9 pages x 2 stratégies.
SELECT cron.schedule(
  'es-academy-seo-pagespeed',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/seo-pagespeed-audit',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 600000
  );
  $$
);

-- ============================================================================
-- 4. Nouveau job : cleanup-audit-log (audit section 5.2)
-- Purge les entrées audit_log > 90 jours pour conformité RGPD.
-- Fonction public.cleanup_old_audit_log() définie en migration 006_polish.sql.
-- Schedule : dimanche 3h UTC (charge minimale).
-- ============================================================================

SELECT cron.schedule(
  'es-academy-cleanup-audit-log',
  '0 3 * * 0',
  $$SELECT public.cleanup_old_audit_log()$$
);

-- ============================================================================
-- 5. Vérification : liste les jobs actifs
-- ============================================================================

SELECT jobid, schedule, jobname, active
FROM cron.job
WHERE jobname LIKE 'es-academy-%'
ORDER BY jobname;
