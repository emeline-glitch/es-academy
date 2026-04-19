-- Durcissement : CHECK constraints pour les enums critiques.
-- Évite qu'une mutation directe DB (script ops, bug API) insère des valeurs invalides
-- qui planteraient ensuite les pages qui matchent sur ces enums.

-- pipeline_stage : 9 valeurs valides (sync avec VALID_STAGES côté API)
DO $$ BEGIN
  ALTER TABLE public.contacts
    ADD CONSTRAINT contacts_pipeline_stage_check
    CHECK (pipeline_stage IS NULL OR pipeline_stage IN (
      'leads', 'prospect', 'rdv_pris', 'rdv_effectif', 'rdv_non_effectif',
      'offre_envoyee', 'non_qualifie', 'gagne', 'perdu'
    ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- contacts.status
DO $$ BEGIN
  ALTER TABLE public.contacts
    ADD CONSTRAINT contacts_status_check
    CHECK (status IS NULL OR status IN ('active', 'archived', 'unsubscribed', 'bounced'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- forms.status
DO $$ BEGIN
  ALTER TABLE public.forms
    ADD CONSTRAINT forms_status_check
    CHECK (status IN ('draft', 'published', 'archived'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- contact_notes.kind
DO $$ BEGIN
  ALTER TABLE public.contact_notes
    ADD CONSTRAINT contact_notes_kind_check
    CHECK (kind IN ('note', 'rdv', 'appel', 'email'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- profiles : coaching_credits_used <= coaching_credits_total
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_coaching_credits_coherent
    CHECK (coaching_credits_used IS NULL OR coaching_credits_total IS NULL OR coaching_credits_used <= coaching_credits_total);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
