-- Migration 045 : ajout des 2 cron jobs SEO sur pg_cron Supabase
--
-- Cohérent avec l'archi existante (seasonal-toggle, chatel-reminders, etc.) :
-- pg_cron Supabase utilise pg_net pour faire un http_post vers /api/cron/* avec
-- le Bearer CRON_SECRET. Les endpoints Next.js verifient le secret et execute.
--
-- 2 nouveaux jobs :
--   - es-academy-seo-audit : audit SEO complet (hebdo lundi 5h UTC)
--   - es-academy-seo-pagespeed : audit PageSpeed Insights (hebdo lundi 6h UTC)
--
-- Le CRON_SECRET est embed en clair dans le job (visible uniquement via accès
-- admin DB Supabase, equivalent secret-level). Pour rotate, schedule + secret
-- doivent être mis à jour ensemble via cron.alter_job().

-- Cleanup si re-run de la migration (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('es-academy-seo-audit') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'es-academy-seo-audit');
  PERFORM cron.unschedule('es-academy-seo-pagespeed') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'es-academy-seo-pagespeed');
EXCEPTION WHEN OTHERS THEN
  -- Ignore si les jobs n'existent pas encore
  NULL;
END $$;

-- ============================================================
-- Job 1 : SEO audit complet (recos basees sur Notion + DB)
-- Schedule : tous les lundis a 5h UTC (= 6h ou 7h heure Paris)
-- ============================================================
SELECT cron.schedule(
  'es-academy-seo-audit',
  '0 5 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/seo-audit',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer bk3JTO7WwsoTRAnUuVYTUZ5kwCV15IYEqF_BwbrOI2U'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- ============================================================
-- Job 2 : PageSpeed Insights audit (Core Web Vitals)
-- Schedule : tous les lundis a 6h UTC (1h apres le seo-audit, evite collision)
-- Timeout : 540s car PageSpeed prend ~30s/page * 18 audits (9 pages × 2 strat) = ~9 min
-- ============================================================
SELECT cron.schedule(
  'es-academy-seo-pagespeed',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/seo-pagespeed-audit',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer bk3JTO7WwsoTRAnUuVYTUZ5kwCV15IYEqF_BwbrOI2U'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 600000
  );
  $$
);
