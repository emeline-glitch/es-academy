-- Migration 006 : polish admin (soft-delete, search full-text, retention audit)

-- 1. Ajouter 'archived' au CHECK de contacts.status
-- (le nom du contrainte peut varier — on essaye sans crasher si absente)
DO $$ BEGIN
  ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_status_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_status_check
  CHECK (status IN ('active', 'unsubscribed', 'bounced', 'archived'));

-- 2. Search : extension pg_trgm pour recherche floue rapide
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index trigram sur email, first_name, last_name (ILIKE rapide)
CREATE INDEX IF NOT EXISTS idx_contacts_email_trgm
  ON public.contacts USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_first_name_trgm
  ON public.contacts USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name_trgm
  ON public.contacts USING gin (last_name gin_trgm_ops);

-- Index trigram sur contact_notes.content pour la recherche dans les notes
CREATE INDEX IF NOT EXISTS idx_contact_notes_content_trgm
  ON public.contact_notes USING gin (content gin_trgm_ops);

-- 3. Retention audit_log : fonction qui supprime les entrées > 90 jours
-- (Supabase n'a pas pg_cron activé par défaut, donc appel manuel ou via API)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_log()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_log
  WHERE created_at < now() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_log() TO service_role, authenticated;

-- 4. Fonction utilitaire : retirer un tag de tous les contacts qui l'ont
CREATE OR REPLACE FUNCTION public.remove_tag_from_all_contacts(tag_to_remove TEXT)
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE public.contacts
    SET tags = array_remove(tags, tag_to_remove)
    WHERE tag_to_remove = ANY(tags);
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.remove_tag_from_all_contacts(TEXT) TO service_role, authenticated;
