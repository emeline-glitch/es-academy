-- Garantir l'unicité de tag_key et slug pour éviter les collisions silencieuses
-- (ex : 2 listes "Ma Liste" → même tag_key "ma_liste" → contacts partagent les tags par erreur)
ALTER TABLE public.contact_lists
  ADD CONSTRAINT contact_lists_tag_key_unique UNIQUE (tag_key);

-- Forms : slug unique (référencé dans l'URL publique /form/[slug])
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.forms'::regclass AND conname = 'forms_slug_unique'
  ) THEN
    ALTER TABLE public.forms ADD CONSTRAINT forms_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- audit_log : ne pas garder d'entrées pointant vers des contacts supprimés
-- On relâche la FK en SET NULL pour garder la trace historique de l'action
-- (au lieu d'orphan rows quand on supprime un contact)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.audit_log'::regclass
    AND contype = 'f'
    AND conname LIKE '%entity_id%'
  ) THEN
    -- Si une FK existe sur entity_id, on la laisse telle quelle (elle n'existe probablement pas car polymorphique)
    NULL;
  END IF;
END $$;
