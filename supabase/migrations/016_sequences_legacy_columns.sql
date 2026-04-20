-- email_sequences avait 2 colonnes pour la même chose : trigger_event (legacy, NOT NULL)
-- et trigger_type (ajoutée par migration 014). L'API ne peuple que trigger_type
-- → violation NOT NULL sur trigger_event à chaque insert.
--
-- On rend trigger_event nullable et on le synchronise automatiquement avec trigger_type
-- via trigger DB — transition douce sans casser les anciens consommateurs éventuels.

ALTER TABLE public.email_sequences
  ALTER COLUMN trigger_event DROP NOT NULL;

-- Back-fill : les nouvelles séquences qui setent trigger_type sans trigger_event
-- auront automatiquement trigger_event = trigger_type.
CREATE OR REPLACE FUNCTION public.sync_sequence_trigger_event()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.trigger_event IS NULL AND NEW.trigger_type IS NOT NULL THEN
    NEW.trigger_event := NEW.trigger_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_sequences_sync_trigger_event ON public.email_sequences;
CREATE TRIGGER email_sequences_sync_trigger_event
  BEFORE INSERT OR UPDATE ON public.email_sequences
  FOR EACH ROW EXECUTE FUNCTION public.sync_sequence_trigger_event();
