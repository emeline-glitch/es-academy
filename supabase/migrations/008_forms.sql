-- Système de formulaires : inscription newsletter / captures leads liés aux listes CRM

ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES public.contact_lists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS success_message TEXT DEFAULT 'Merci ! Ton inscription est confirmée.',
  ADD COLUMN IF NOT EXISTS background_image_url TEXT,
  ADD COLUMN IF NOT EXISTS submit_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS require_phone BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_last_name BOOLEAN NOT NULL DEFAULT false;

-- Slug unique quand publié (on laisse null pour les brouillons)
CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_slug_unique
  ON public.forms (slug)
  WHERE slug IS NOT NULL;

-- Public READ policy pour les formulaires publiés (la page publique doit lire)
DROP POLICY IF EXISTS "Public read published forms" ON public.forms;
CREATE POLICY "Public read published forms" ON public.forms FOR SELECT
  USING (status = 'published');
