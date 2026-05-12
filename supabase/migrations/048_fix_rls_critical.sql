-- 048 : Audit RLS complet et correctifs critiques et majeurs.
-- Source : RLS_AUDIT.md (verdict 1 critique F1 + 7 majeurs F2-F8 + 4 mineurs M1-M4).
-- Cette migration fixe F1 a F8. Les mineurs M1-M4 sont notes dans le rapport
-- et a traiter au morceau 4 apres validation.
--
-- Toutes les operations sont idempotentes (DROP IF EXISTS avant CREATE).
-- Le service_role bypass automatiquement les RLS via la cle service ; les
-- nouvelles policies ALL TO authenticated ne le concernent pas.

-- ============================================================
-- F1 : remove_tag_from_all_contacts (CRITIQUE)
-- Avant : EXECUTE TO PUBLIC + pas de search_path + pas de check admin
-- Apres : REVOKE PUBLIC/anon/authenticated, GRANT service_role,
--         SET search_path, check admin defense en profondeur
-- ============================================================

CREATE OR REPLACE FUNCTION public.remove_tag_from_all_contacts(tag_to_remove text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  affected_count INTEGER;
  caller_role text;
BEGIN
  caller_role := coalesce(current_setting('request.jwt.claim.role', true), '');
  IF caller_role <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'permission denied: admin only' USING ERRCODE = '42501';
  END IF;
  UPDATE public.contacts
    SET tags = array_remove(tags, tag_to_remove)
    WHERE tag_to_remove = ANY(tags);
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.remove_tag_from_all_contacts(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_tag_from_all_contacts(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.remove_tag_from_all_contacts(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.remove_tag_from_all_contacts(text) TO service_role;

-- ============================================================
-- F2 : Tables RLS-on-zero-policy, donnees sensibles
-- Pattern : admin ALL via EXISTS profiles (coherent avec 044)
-- ============================================================

-- contacts (35K emails, donnees PII)
DROP POLICY IF EXISTS "Admin manage contacts" ON public.contacts;
CREATE POLICY "Admin manage contacts" ON public.contacts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- email_campaigns (campagnes mails)
DROP POLICY IF EXISTS "Admin manage email_campaigns" ON public.email_campaigns;
CREATE POLICY "Admin manage email_campaigns" ON public.email_campaigns
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- email_sends (sends individuels, contient destinataires)
DROP POLICY IF EXISTS "Admin manage email_sends" ON public.email_sends;
CREATE POLICY "Admin manage email_sends" ON public.email_sends
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- email_sequences
DROP POLICY IF EXISTS "Admin manage email_sequences" ON public.email_sequences;
CREATE POLICY "Admin manage email_sequences" ON public.email_sequences
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- email_sequence_steps
DROP POLICY IF EXISTS "Admin manage email_sequence_steps" ON public.email_sequence_steps;
CREATE POLICY "Admin manage email_sequence_steps" ON public.email_sequence_steps
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- email_sequence_enrollments
DROP POLICY IF EXISTS "Admin manage email_sequence_enrollments" ON public.email_sequence_enrollments;
CREATE POLICY "Admin manage email_sequence_enrollments" ON public.email_sequence_enrollments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- processed_stripe_events (idempotence webhook)
DROP POLICY IF EXISTS "Admin manage processed_stripe_events" ON public.processed_stripe_events;
CREATE POLICY "Admin manage processed_stripe_events" ON public.processed_stripe_events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- processed_sns_messages (idempotence SNS feedback)
DROP POLICY IF EXISTS "Admin manage processed_sns_messages" ON public.processed_sns_messages;
CREATE POLICY "Admin manage processed_sns_messages" ON public.processed_sns_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- rate_limits (table interne rate-limiting)
DROP POLICY IF EXISTS "Admin read rate_limits" ON public.rate_limits;
CREATE POLICY "Admin read rate_limits" ON public.rate_limits
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- seasonal_enrollments (inscriptions saisonnieres, contient emails et donnees prospects)
DROP POLICY IF EXISTS "Admin manage seasonal_enrollments" ON public.seasonal_enrollments;
CREATE POLICY "Admin manage seasonal_enrollments" ON public.seasonal_enrollments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- seo_audits
DROP POLICY IF EXISTS "Admin manage seo_audits" ON public.seo_audits;
CREATE POLICY "Admin manage seo_audits" ON public.seo_audits
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- seo_keyword_history
DROP POLICY IF EXISTS "Admin manage seo_keyword_history" ON public.seo_keyword_history;
CREATE POLICY "Admin manage seo_keyword_history" ON public.seo_keyword_history
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- seo_page_views
DROP POLICY IF EXISTS "Admin manage seo_page_views" ON public.seo_page_views;
CREATE POLICY "Admin manage seo_page_views" ON public.seo_page_views
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- seo_pagespeed_history
DROP POLICY IF EXISTS "Admin manage seo_pagespeed_history" ON public.seo_pagespeed_history;
CREATE POLICY "Admin manage seo_pagespeed_history" ON public.seo_pagespeed_history
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- seo_recommendations
DROP POLICY IF EXISTS "Admin manage seo_recommendations" ON public.seo_recommendations;
CREATE POLICY "Admin manage seo_recommendations" ON public.seo_recommendations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- seo_settings
DROP POLICY IF EXISTS "Admin manage seo_settings" ON public.seo_settings;
CREATE POLICY "Admin manage seo_settings" ON public.seo_settings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- seo_target_keywords
DROP POLICY IF EXISTS "Admin manage seo_target_keywords" ON public.seo_target_keywords;
CREATE POLICY "Admin manage seo_target_keywords" ON public.seo_target_keywords
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- F3 : family_subscriptions, lecture par le user proprietaire
-- ============================================================

DROP POLICY IF EXISTS "Users read own family subscription" ON public.family_subscriptions;
CREATE POLICY "Users read own family subscription" ON public.family_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin manage family_subscriptions" ON public.family_subscriptions;
CREATE POLICY "Admin manage family_subscriptions" ON public.family_subscriptions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- F4 : cleanup_old_audit_log et cleanup_rate_limits durcies
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_log()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_log
  WHERE created_at < now() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_old_audit_log() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_audit_log() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_audit_log() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_log() TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE created_at < now() - INTERVAL '24 hours';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;

-- ============================================================
-- F5 : Triggers handle_new_user et sync_email_to_profile, search_path
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_email_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- F6 : audit_log, policy INSERT pour coherence
-- ============================================================

DROP POLICY IF EXISTS "Admin insert audit log" ON public.audit_log;
CREATE POLICY "Admin insert audit log" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- F7 : profiles, policy admin ALL pour coherence
-- ============================================================
-- Note : les 3 policies existantes restent (Users SELECT/UPDATE own, Admin
-- update coaching credits). On ajoute une policy admin pour lire/inserer/
-- supprimer tous les profils, sans casser les policies user own.

DROP POLICY IF EXISTS "Admin read all profiles" ON public.profiles;
CREATE POLICY "Admin read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'));

DROP POLICY IF EXISTS "Admin insert profiles" ON public.profiles;
CREATE POLICY "Admin insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'));

DROP POLICY IF EXISTS "Admin delete profiles" ON public.profiles;
CREATE POLICY "Admin delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'));

-- ============================================================
-- F8 : View contact_lists_with_count, security_invoker
-- ============================================================
-- Postgres 15+ : security_invoker = true fait que la vue applique les RLS
-- de l appelant et non du proprietaire.

ALTER VIEW public.contact_lists_with_count SET (security_invoker = true);

-- ============================================================
-- Verification post-migration
-- ============================================================
-- Apres apply, executer :
--   SELECT tablename, count(*) AS pol_count
--   FROM pg_policies WHERE schemaname = 'public'
--   GROUP BY tablename ORDER BY tablename;
--
-- Toutes les tables doivent avoir au moins 1 policy. Verifier aussi que
-- les RPC sensibles ne sont plus appelables par anon/authenticated via :
--   SET ROLE authenticated;
--   SELECT public.remove_tag_from_all_contacts('test');
--   -- Attendu : ERREUR permission denied (code 42501)
