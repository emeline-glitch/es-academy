-- La colonne `status` était référencée partout dans le code (promote, /admin/eleves, etc.)
-- mais jamais créée en DB → erreur "Could not find the 'status' column of 'enrollments' in the schema cache"
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Les anciens enrollments deviennent automatiquement 'active' grâce au DEFAULT.

-- course_id était NOT NULL hérité du design Stripe initial ; la bascule CRM
-- ne rattache pas forcément à un cours précis → on le rend optionnel.
ALTER TABLE public.enrollments
  ALTER COLUMN course_id DROP NOT NULL;

-- Index sur (user_id, status) pour les checks "enrollment actif ?"
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status
  ON public.enrollments(user_id, status)
  WHERE status = 'active';
