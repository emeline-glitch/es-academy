-- Sprint 1 ES Academy : infra pour capture leads + parcours client v1.0
-- Tables : lead_magnets, quiz_responses, billing_reminders, contact_events, consent_log, seasonal_enrollments
-- Extensions : contacts (+ colonnes alumni/rgpd/tracking)

-- ============================================================================
-- Extension contacts
-- ============================================================================

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_alumni_evermind BOOLEAN DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS alumni_migrated_at TIMESTAMPTZ;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS rgpd_cohort INTEGER;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS primary_source TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS primary_source_detail TEXT;

CREATE INDEX IF NOT EXISTS idx_contacts_alumni ON public.contacts(is_alumni_evermind) WHERE is_alumni_evermind = true;
CREATE INDEX IF NOT EXISTS idx_contacts_last_activity ON public.contacts(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_contacts_rgpd_cohort ON public.contacts(rgpd_cohort) WHERE rgpd_cohort IS NOT NULL;

-- ============================================================================
-- Table lead_magnets
-- Référentiel éditable des 6 portes d'entrée (masterclass, quiz, simulateur, cahier, avent, chasse)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lead_magnets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  available_from DATE,
  available_until DATE,
  welcome_sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE SET NULL,
  landing_page_url TEXT,
  asset_url TEXT,
  cover_image_url TEXT,
  opt_in_tag TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT lead_magnets_format_check CHECK (
    format IN ('masterclass', 'quiz', 'simulator', 'pdf', 'email_series', 'game')
  )
);

CREATE INDEX IF NOT EXISTS idx_lead_magnets_active ON public.lead_magnets(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_lead_magnets_slug ON public.lead_magnets(slug);

DROP TRIGGER IF EXISTS lead_magnets_updated_at ON public.lead_magnets;
CREATE TRIGGER lead_magnets_updated_at
  BEFORE UPDATE ON public.lead_magnets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- Table quiz_responses
-- Captures les réponses au quiz "Es-tu fait pour l'investissement locatif"
-- Ingérées via webhook VideoAsk en V1, puis custom en V2 Q3 2026
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  quiz_slug TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL,
  result_category TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  videoask_response_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT quiz_responses_score_check CHECK (score >= 0 AND score <= 10),
  CONSTRAINT quiz_responses_category_check CHECK (
    result_category IN ('tu_perds_argent', 'operation_blanche', 'autofinancement_positif')
  )
);

CREATE INDEX IF NOT EXISTS idx_quiz_responses_contact ON public.quiz_responses(contact_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_category ON public.quiz_responses(result_category);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_completed ON public.quiz_responses(completed_at DESC);

-- ============================================================================
-- Table billing_reminders
-- Gestion loi Chatel pour les 3 mois ES Family offerts aux élèves Academy
-- (et les 12 mois offerts aux alumni Evermind)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.billing_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_setup_intent_id TEXT,
  stripe_subscription_id TEXT,
  monthly_price_cents INTEGER NOT NULL,
  trial_start DATE NOT NULL,
  trial_end DATE NOT NULL,
  reminder_j15_sent_at TIMESTAMPTZ,
  reminder_j7_sent_at TIMESTAMPTZ,
  activation_confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT billing_reminders_product_check CHECK (
    product IN ('family_trial_3m', 'family_trial_12m_alumni')
  )
);

CREATE INDEX IF NOT EXISTS idx_billing_reminders_trial_end ON public.billing_reminders(trial_end)
  WHERE cancelled_at IS NULL AND activation_confirmed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_billing_reminders_contact ON public.billing_reminders(contact_id);

DROP TRIGGER IF EXISTS billing_reminders_updated_at ON public.billing_reminders;
CREATE TRIGGER billing_reminders_updated_at
  BEFORE UPDATE ON public.billing_reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- Table contact_events
-- Events tracking pour déclencher les séquences comportementales
-- (multi-magnet, masterclass-watched, cta-click, inactive-90, antony-alert, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_events_contact_type ON public.contact_events(contact_id, event_type);
CREATE INDEX IF NOT EXISTS idx_contact_events_type_created ON public.contact_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_events_created ON public.contact_events(created_at DESC);

-- ============================================================================
-- Table consent_log
-- Registre RGPD obligatoire : trace de chaque opt-in/opt-out avec base juridique
-- Utilisé pour prouver le consentement en cas de contrôle CNIL
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consent_basis TEXT,
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_proof JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT consent_log_type_check CHECK (
    consent_type IN ('explicit', 'legitimate_interest', 'opt_out', 're_consent', 'bounce_exclusion')
  )
);

CREATE INDEX IF NOT EXISTS idx_consent_log_contact ON public.consent_log(contact_id, consent_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_consent_log_type ON public.consent_log(consent_type);

-- ============================================================================
-- Table seasonal_enrollments
-- Inscriptions aux moments forts annuels (cahier vacances, avent, chasse oeufs)
-- Empêche la double inscription même si on relance la campagne
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.seasonal_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  event_slug TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(contact_id, event_slug)
);

CREATE INDEX IF NOT EXISTS idx_seasonal_enrollments_event ON public.seasonal_enrollments(event_slug);
CREATE INDEX IF NOT EXISTS idx_seasonal_enrollments_contact ON public.seasonal_enrollments(contact_id);

-- ============================================================================
-- RPC : lead_magnets_performance
-- Stats par lead magnet : opt-ins, conversions Academy, taux de conversion
-- ============================================================================

CREATE OR REPLACE FUNCTION public.lead_magnets_performance(period_days INTEGER DEFAULT 30)
RETURNS TABLE (
  lead_magnet_slug TEXT,
  lead_magnet_name TEXT,
  opt_ins BIGINT,
  conversions_to_academy BIGINT,
  conversion_rate NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH period AS (
    SELECT (now() - (period_days || ' days')::interval) AS since
  ),
  opt_ins_count AS (
    SELECT
      lm.slug,
      lm.name,
      count(DISTINCT c.id) AS n_opt_ins
    FROM public.lead_magnets lm
    LEFT JOIN public.contacts c ON c.tags @> ARRAY[lm.opt_in_tag]
      AND c.subscribed_at >= (SELECT since FROM period)
    GROUP BY lm.slug, lm.name
  ),
  conversions AS (
    SELECT
      lm.slug,
      count(DISTINCT e.user_id) AS n_conversions
    FROM public.lead_magnets lm
    LEFT JOIN public.contacts c ON c.tags @> ARRAY[lm.opt_in_tag]
    LEFT JOIN public.profiles p ON lower(p.email) = lower(c.email)
    LEFT JOIN public.enrollments e ON e.user_id = p.id
      AND e.product_name = 'academy'
      AND e.purchased_at >= (SELECT since FROM period)
    GROUP BY lm.slug
  )
  SELECT
    o.slug AS lead_magnet_slug,
    o.name AS lead_magnet_name,
    o.n_opt_ins AS opt_ins,
    COALESCE(cv.n_conversions, 0) AS conversions_to_academy,
    CASE WHEN o.n_opt_ins > 0
      THEN round((COALESCE(cv.n_conversions, 0)::numeric / o.n_opt_ins) * 100, 2)
      ELSE 0
    END AS conversion_rate
  FROM opt_ins_count o
  LEFT JOIN conversions cv ON cv.slug = o.slug
  ORDER BY o.n_opt_ins DESC;
$$;

GRANT EXECUTE ON FUNCTION public.lead_magnets_performance(INTEGER) TO authenticated, service_role;

-- ============================================================================
-- RPC : alumni_dashboard
-- Vue d'ensemble de la migration alumni Evermind
-- ============================================================================

CREATE OR REPLACE FUNCTION public.alumni_dashboard()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_alumni', (SELECT count(*) FROM public.contacts WHERE is_alumni_evermind = true),
    'migrated', (SELECT count(*) FROM public.contacts WHERE is_alumni_evermind = true AND alumni_migrated_at IS NOT NULL),
    'family_activated', (
      SELECT count(*) FROM public.billing_reminders br
      JOIN public.contacts c ON c.id = br.contact_id
      WHERE c.is_alumni_evermind = true
        AND br.product = 'family_trial_12m_alumni'
        AND br.activation_confirmed_at IS NOT NULL
    ),
    'family_cancelled', (
      SELECT count(*) FROM public.billing_reminders br
      JOIN public.contacts c ON c.id = br.contact_id
      WHERE c.is_alumni_evermind = true
        AND br.product = 'family_trial_12m_alumni'
        AND br.cancelled_at IS NOT NULL
    ),
    'opted_out', (
      SELECT count(*) FROM public.consent_log cl
      JOIN public.contacts c ON c.id = cl.contact_id
      WHERE c.is_alumni_evermind = true
        AND cl.consent_type = 'opt_out'
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.alumni_dashboard() TO authenticated, service_role;
