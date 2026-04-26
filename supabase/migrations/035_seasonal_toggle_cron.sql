-- Cron seasonal-toggle : active/desactive lead_magnets selon available_from/until.
--
-- Permet aux landings saisonnieres (cahier vacances juillet-aout, calendrier
-- avent decembre, chasse oeufs Paques) d'etre auto-activees au bon moment
-- sans intervention manuelle.
--
-- Dates 2027 ajoutees pour chasse-oeufs : Paques tombe le 28 mars 2027,
-- semaine d'activation = 22-28 mars 2027 (bonus : -1 a +1 jours apres).

UPDATE public.lead_magnets
SET available_from = '2027-03-22', available_until = '2027-03-29'
WHERE slug = 'chasse-oeufs' AND available_from IS NULL;

-- Job pg_cron quotidien a 5h UTC (= 7h Paris ete, 6h hiver)
-- avant l'envoi de tous les autres crons.
DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'es-academy-seasonal-toggle';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'es-academy-seasonal-toggle',
  '0 5 * * *',
  $job$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/seasonal-toggle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer bk3JTO7WwsoTRAnUuVYTUZ5kwCV15IYEqF_BwbrOI2U'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $job$
);
