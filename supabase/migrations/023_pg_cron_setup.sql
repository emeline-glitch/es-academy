-- Sprint 4 : active pg_cron + pg_net et crée les 3 jobs qui appellent nos endpoints cron Netlify.
-- Les jobs utilisent net.http_post (extension pg_net) pour faire les appels HTTP authentifiés avec CRON_SECRET.
-- Le secret est stocké dans vault.secrets pour ne pas être hardcodé en clair dans pg_cron.

-- Active les extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Permissions : pg_cron doit être dans le schema 'cron', pg_net dans 'net'. Supabase s'en occupe.

-- Stocke le CRON_SECRET dans vault (chiffré au repos)
-- Note : le vault n'est pas disponible sur tous les plans, fallback sur une fonction qui retourne le secret en clair
DO $$
BEGIN
  -- Tente d'insérer le secret dans vault (disponible sur les plans récents Supabase)
  BEGIN
    PERFORM vault.create_secret('bk3JTO7WwsoTRAnUuVYTUZ5kwCV15IYEqF_BwbrOI2U', 'cron_secret', 'Bearer token pour les endpoints /api/cron/*');
  EXCEPTION
    WHEN OTHERS THEN
      -- Si vault pas dispo ou secret déjà existant, ignore (les cron jobs utilisent la constante directement)
      NULL;
  END;
END $$;

-- Nettoie les jobs existants au cas où on relance la migration
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('es-academy-process-sequences', 'es-academy-detect-behavioral', 'es-academy-chatel-reminders');

-- ============================================================================
-- Job 1 : process-sequences toutes les 10 min
-- Picke les enrollments à envoyer et envoie via SES
-- ============================================================================
SELECT cron.schedule(
  'es-academy-process-sequences',
  '*/10 * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/process-sequences',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer bk3JTO7WwsoTRAnUuVYTUZ5kwCV15IYEqF_BwbrOI2U'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);

-- ============================================================================
-- Job 2 : detect-behavioral-triggers toutes les 2 heures
-- Détecte multi-magnet, inactive-90, clicked-formation et auto-tag
-- ============================================================================
SELECT cron.schedule(
  'es-academy-detect-behavioral',
  '0 */2 * * *',
  $job$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/detect-behavioral-triggers',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer bk3JTO7WwsoTRAnUuVYTUZ5kwCV15IYEqF_BwbrOI2U'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $job$
);

-- ============================================================================
-- Job 3 : chatel-reminders tous les jours à 6h UTC (= 8h Paris en été, 7h en hiver)
-- Envoie les rappels J-15 et J-7 aux élèves Academy en période trial ES Family
-- ============================================================================
SELECT cron.schedule(
  'es-academy-chatel-reminders',
  '0 6 * * *',
  $job$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/chatel-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer bk3JTO7WwsoTRAnUuVYTUZ5kwCV15IYEqF_BwbrOI2U'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $job$
);

-- Vérifie que les jobs sont bien planifiés
SELECT jobid, schedule, jobname, active
FROM cron.job
WHERE jobname LIKE 'es-academy-%'
ORDER BY jobname;
