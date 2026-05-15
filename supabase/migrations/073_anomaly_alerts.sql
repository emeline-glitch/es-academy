-- 073_anomaly_alerts : système d'alertes temps réel pour Emeline.
--
-- Modèle : 1 ligne = 1 anomalie détectée. signal_key + signal_id forment
-- la clé d'unicité pour éviter de spammer 50 mails pour le même incident.
-- Une fois l'alerte envoyée (alerted_at IS NOT NULL), on ne renvoie plus
-- tant que l'anomalie n'est pas résolue (resolved_at) puis re-déclenchée.
--
-- Pourquoi pas réutiliser audit_log : audit_log est append-only et trace
-- des événements ponctuels (changement de stage, contact promu). Ici on a
-- besoin d'un état (open/resolved) et d'un dédup par incident, donc table
-- dédiée plus simple.

CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Catégorie d'anomalie : welcome_email_failed, dunning_critical,
  -- family_gift_failed, cron_failed, abandoned_spike, etc.
  signal_key TEXT NOT NULL,
  -- ID spécifique à l'instance (enrollment_id, subscription_id, contact email…).
  -- Permet d'avoir N alertes ouvertes simultanément pour la même catégorie.
  signal_id TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  -- URL admin pour aller voir/résoudre le problème (ex: /admin/eleves/<id>).
  action_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Quand le mail à Emeline a été envoyé. NULL = pas encore alertée.
  alerted_at TIMESTAMPTZ,
  -- Quand l'anomalie est repassée OK (auto-résolue par le détecteur).
  resolved_at TIMESTAMPTZ,
  UNIQUE (signal_key, signal_id)
);

CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_open
  ON public.anomaly_alerts (signal_key, alerted_at)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_unalerted
  ON public.anomaly_alerts (detected_at)
  WHERE alerted_at IS NULL AND resolved_at IS NULL;

ALTER TABLE public.anomaly_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anomaly_alerts service all"
  ON public.anomaly_alerts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pg_cron : detecteur d'anomalies toutes les 30 minutes.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_secret TEXT;
BEGIN
  -- Recupere le CRON_SECRET via vault (cf migration 023)
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret'
  LIMIT 1;

  IF v_secret IS NULL THEN
    RAISE WARNING '[migration 073] vault secret "cron_secret" absent, cron job non programme. Inserer le secret puis relancer cette migration.';
    RETURN;
  END IF;

  -- Idempotent : retire l'ancien job si deja la
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'es-academy-anomaly-detector';

  PERFORM cron.schedule(
    'es-academy-anomaly-detector',
    '*/30 * * * *',
    format($job$
      SELECT net.http_post(
        url := 'https://emeline-siron.fr/api/cron/anomaly-detector',
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
