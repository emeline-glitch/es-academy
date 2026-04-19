-- Listes et dossiers de listes pour organiser les contacts
-- Chaque "liste" correspond à un tag existant sur le contact, groupée éventuellement dans un "dossier"

-- Colonne téléphone sur contacts (pour saisie manuelle enrichie)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE TABLE IF NOT EXISTS public.contact_list_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contact_list_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage list folders" ON public.contact_list_folders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE IF NOT EXISTS public.contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES public.contact_list_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  tag_key TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT 'gray',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage lists" ON public.contact_lists FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE INDEX IF NOT EXISTS idx_contact_lists_folder ON public.contact_lists(folder_id);
CREATE INDEX IF NOT EXISTS idx_contact_lists_tag_key ON public.contact_lists(tag_key);
