-- 3 pipelines différents : Academy (formation), Family (abonnement), Sur-mesure (coaching/demandes custom)
-- Chaque contact peut être dans 0, 1, 2 ou 3 pipelines simultanément.
-- La colonne existante pipeline_stage reste pour Academy (compatibilité toutes les séquences/dashboards existants).

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS pipeline_family_stage TEXT,
  ADD COLUMN IF NOT EXISTS pipeline_family_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pipeline_custom_stage TEXT,
  ADD COLUMN IF NOT EXISTS pipeline_custom_updated_at TIMESTAMPTZ;

-- CHECK constraints par pipeline (sync avec lib/utils/pipeline.ts)
-- Academy garde les 9 stages existants (contrainte déjà posée par migration 013)

-- Family : 5 stages
DO $$ BEGIN
  ALTER TABLE public.contacts
    ADD CONSTRAINT contacts_pipeline_family_stage_check
    CHECK (pipeline_family_stage IS NULL OR pipeline_family_stage IN (
      'leads', 'trial_actif', 'membre_payant', 'churn', 'perdu'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Sur-mesure : 7 stages
DO $$ BEGIN
  ALTER TABLE public.contacts
    ADD CONSTRAINT contacts_pipeline_custom_stage_check
    CHECK (pipeline_custom_stage IS NULL OR pipeline_custom_stage IN (
      'demande', 'qualification', 'devis_envoye', 'accepte', 'en_cours', 'termine', 'perdu'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index pour les filtres Kanban rapides
CREATE INDEX IF NOT EXISTS idx_contacts_pipeline_family ON public.contacts(pipeline_family_stage) WHERE pipeline_family_stage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_pipeline_custom ON public.contacts(pipeline_custom_stage) WHERE pipeline_custom_stage IS NOT NULL;

-- Étend la RPC dashboard_stats pour inclure les 3 pipelines
-- (l'ancienne version ne renvoyait que pipeline_counts pour Academy)
CREATE OR REPLACE FUNCTION public.dashboard_stats(month_start timestamptz, today_start timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_profiles',     (SELECT count(*) FROM public.profiles),
    'total_contacts',     (SELECT count(*) FROM public.contacts),
    'today_contacts',     (SELECT count(*) FROM public.contacts WHERE subscribed_at >= today_start),
    'total_enrollments',  (SELECT count(*) FROM public.enrollments),
    'total_revenue',      (SELECT COALESCE(sum(amount_paid), 0) FROM public.enrollments),
    'month_revenue',      (SELECT COALESCE(sum(amount_paid), 0) FROM public.enrollments WHERE purchased_at >= month_start),
    'month_sales_count',  (SELECT count(*) FROM public.enrollments WHERE purchased_at >= month_start),
    'total_campaigns',    (SELECT count(*) FROM public.email_campaigns),
    'pipeline_counts',    (
      SELECT COALESCE(jsonb_object_agg(stage, n), '{}'::jsonb)
      FROM (
        SELECT COALESCE(pipeline_stage, 'leads') AS stage, count(*) AS n
        FROM public.contacts
        WHERE pipeline_stage IS NOT NULL
        GROUP BY COALESCE(pipeline_stage, 'leads')
      ) s
    ),
    'pipeline_family_counts', (
      SELECT COALESCE(jsonb_object_agg(stage, n), '{}'::jsonb)
      FROM (
        SELECT pipeline_family_stage AS stage, count(*) AS n
        FROM public.contacts
        WHERE pipeline_family_stage IS NOT NULL
        GROUP BY pipeline_family_stage
      ) s
    ),
    'pipeline_custom_counts', (
      SELECT COALESCE(jsonb_object_agg(stage, n), '{}'::jsonb)
      FROM (
        SELECT pipeline_custom_stage AS stage, count(*) AS n
        FROM public.contacts
        WHERE pipeline_custom_stage IS NOT NULL
        GROUP BY pipeline_custom_stage
      ) s
    )
  );
$$;
