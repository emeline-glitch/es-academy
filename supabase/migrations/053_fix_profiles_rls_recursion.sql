-- Fix recursion infinie dans les policies RLS de la table profiles.
--
-- Probleme :
--   Les policies "Admin read all profiles", "Admin delete profiles",
--   "Admin insert profiles" et "Admin update coaching credits" utilisaient
--     USING (EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'))
--   ce qui re-declenche les policies sur profiles a chaque check -> boucle infinie.
--   Postgres renvoie : "infinite recursion detected in policy for relation profiles".
--
-- Impact : tous les admins secondaires (Antony, Tiffany, ...) recevaient 403
--   sur quasi tous les endpoints /api/admin/* (requireAdmin() faisait un SELECT
--   sur profiles via le client cookies-based qui passe par RLS).
--   Emeline n'avait pas le bug car son email matche ADMIN_EMAIL et le short-circuit
--   dans requireAdmin() retourne avant d'interroger profiles.
--
-- Fix : extraire le check admin dans une fonction SECURITY DEFINER qui bypass RLS.

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon, service_role;

DROP POLICY IF EXISTS "Admin read all profiles" ON public.profiles;
CREATE POLICY "Admin read all profiles" ON public.profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin delete profiles" ON public.profiles;
CREATE POLICY "Admin delete profiles" ON public.profiles
  FOR DELETE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin insert profiles" ON public.profiles;
CREATE POLICY "Admin insert profiles" ON public.profiles
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin update coaching credits" ON public.profiles;
CREATE POLICY "Admin update coaching credits" ON public.profiles
  FOR UPDATE
  USING (public.is_admin(auth.uid()));
