-- Pipeline commercial : stages + notes de RDV sur les contacts

-- 1. Colonne pipeline_stage sur contacts
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT NOT NULL DEFAULT 'leads'
    CHECK (pipeline_stage IN (
      'leads',
      'prospect',
      'rdv_pris',
      'rdv_effectif',
      'rdv_non_effectif',
      'offre_envoyee',
      'non_qualifie',
      'gagne',
      'perdu'
    )),
  ADD COLUMN IF NOT EXISTS pipeline_updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_contacts_pipeline_stage ON public.contacts(pipeline_stage);

-- 2. Table contact_notes : notes de RDV ou libres sur un contact
CREATE TABLE IF NOT EXISTS public.contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  kind TEXT DEFAULT 'note' CHECK (kind IN ('note', 'rdv', 'appel', 'email')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage contact notes" ON public.contact_notes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON public.contact_notes(contact_id, created_at DESC);
