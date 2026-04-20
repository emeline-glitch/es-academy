-- Colonnes manquantes sur email_sequences référencées par l'API mais jamais créées en DB.
-- Même symptôme que migration 010 (enrollments.status) — schema drift.

ALTER TABLE public.email_sequences
  ADD COLUMN IF NOT EXISTS trigger_type TEXT,
  ADD COLUMN IF NOT EXISTS trigger_value TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Valider trigger_type via CHECK (sync avec VALID_TRIGGERS de l'API sequences)
DO $$ BEGIN
  ALTER TABLE public.email_sequences
    ADD CONSTRAINT email_sequences_trigger_type_check
    CHECK (trigger_type IS NULL OR trigger_type IN (
      'tag_added', 'form_submit', 'manual', 'product_purchase'
    ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Idem status
DO $$ BEGIN
  ALTER TABLE public.email_sequences
    ADD CONSTRAINT email_sequences_status_check
    CHECK (status IS NULL OR status IN ('draft', 'active', 'paused', 'archived'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Trigger auto-update updated_at à chaque modification
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_sequences_updated_at ON public.email_sequences;
CREATE TRIGGER email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
