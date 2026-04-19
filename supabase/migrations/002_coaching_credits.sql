-- Ajoute le suivi des crédits de coaching par élève
-- Chaque élève a un nombre total de coachings achetés et un nombre utilisé

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coaching_credits_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coaching_credits_used  INTEGER NOT NULL DEFAULT 0;

-- Les admins peuvent mettre à jour les crédits de n'importe quel élève
CREATE POLICY "Admin update coaching credits"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Vue pratique pour l'admin : nombre de coachings restants calculé
CREATE OR REPLACE VIEW public.profiles_with_credits AS
  SELECT
    p.*,
    GREATEST(p.coaching_credits_total - p.coaching_credits_used, 0) AS coaching_credits_remaining
  FROM public.profiles p;
