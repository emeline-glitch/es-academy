-- Durcissement securite suite aux WARN du Supabase advisor.
-- Email du 11 mai 2026 : la "table publicly accessible" critique a deja
-- ete resolue. Reste les WARN qu'on traite ici en defense in depth.
--
-- 3 categories :
--  1) function_search_path_mutable (17 fonctions) -> SET search_path
--  2) anon_security_definer_function_executable (9 fonctions) -> REVOKE
--     EXECUTE de anon sur celles qui ne sont JAMAIS appelees par REST
--     /rest/v1/rpc/<fn>. On garde is_admin executable car utilise par
--     les RLS policies sur profiles (Postgres l'appelle via auth.uid()).
--  3) Buckets public_bucket_allows_listing (avatars, email-images) :
--     les images sont accessibles par URL directe, le LIST est inutile
--     et fuite la structure. On retire le SELECT broad et on garde une
--     policy qui n'autorise QUE les requetes par nom de fichier connu.

-- =========================================================
-- 1) FIX search_path mutable (immuable -> empeche injection)
-- =========================================================

ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.sequences_with_counts() SET search_path = public;
ALTER FUNCTION public.record_academy_welcome_email_send(uuid, boolean, text) SET search_path = public;
ALTER FUNCTION public.academy_welcome_email_failed_count() SET search_path = public;
ALTER FUNCTION public.sync_sequence_trigger_event() SET search_path = public;
ALTER FUNCTION public.academy_welcome_email_pending(integer) SET search_path = public;
ALTER FUNCTION public.tunnels_stats() SET search_path = public;
ALTER FUNCTION public.update_family_subscriptions_updated_at() SET search_path = public;
ALTER FUNCTION public.lead_magnets_performance(integer) SET search_path = public;
ALTER FUNCTION public.alumni_dashboard() SET search_path = public;
ALTER FUNCTION public.get_pending_sequence_sends(integer) SET search_path = public;
ALTER FUNCTION public.upsert_contact_with_tags(text, text, text, text[], text) SET search_path = public;
ALTER FUNCTION public.seo_target_keywords_set_updated_at() SET search_path = public;
ALTER FUNCTION public.set_quiz_questions_updated_at() SET search_path = public;
ALTER FUNCTION public.import_contact_with_consent(text, text, text, text, text[], text, text, text, boolean, integer, text, text, jsonb) SET search_path = public;
ALTER FUNCTION public.seo_settings_set_updated_at() SET search_path = public;
ALTER FUNCTION public.dashboard_stats(timestamp with time zone, timestamp with time zone) SET search_path = public;

-- =========================================================
-- 2) REVOKE EXECUTE FROM anon sur les SECURITY DEFINER qui
--    n'ont pas vocation a etre appelees sans auth.
--    On garde sync_email_to_profile et handle_new_user accessibles
--    car ce sont des triggers auth (appeles par le system role lors
--    de l'inscription via /auth/v1/signup, pas via /rest/v1/rpc).
--    Note : un trigger sur auth.users execute toujours avec les droits
--    du trigger owner, le grant a anon est juste pour le call REST.
-- =========================================================

-- IMPORTANT : REVOKE FROM anon ne suffit pas. Postgres a un grant
-- implicite a PUBLIC (tous les roles, anon inclus) sur les fonctions
-- a la creation. Faut REVOKE de PUBLIC pour vraiment couper l'acces.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_email_to_profile() FROM PUBLIC, anon, authenticated;

-- SEO RPCs : appeles uniquement depuis /admin/seo via service client
-- server-side. Pas besoin d'etre accessibles a authenticated/anon.
REVOKE EXECUTE ON FUNCTION public.seo_dashboard_stats(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seo_keyword_history_chart(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seo_latest_pagespeed(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seo_top_campaigns(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seo_top_pages(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seo_top_sources(integer, integer) FROM PUBLIC, anon, authenticated;

-- is_admin : DOIT rester appelable par authenticated car Postgres
-- l'invoque dans les RLS policies sur profiles avec le role du caller
-- (meme pour une fonction SECURITY DEFINER, l'EXECUTE est verifie au
-- moment de l'appel). On accepte le warn pour cette fonction.

-- =========================================================
-- 3) Durcir les buckets publics : interdire le LIST
--    Le bucket reste public (les URLs directes marchent), mais on ne
--    peut plus enumerer le contenu sans authentification.
-- =========================================================

DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
CREATE POLICY "Avatars public read by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND name IS NOT NULL);

-- Pour avatars, un user authentifie doit pouvoir lister SES PROPRES
-- fichiers (la storage UI). Le path est <user_id>/avatar.<ext>.
DROP POLICY IF EXISTS "Avatars list own" ON storage.objects;
CREATE POLICY "Avatars list own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "email-images public read" ON storage.objects;
CREATE POLICY "email-images public read by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'email-images' AND name IS NOT NULL);
