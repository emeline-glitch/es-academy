-- 067_revoke_public_dashboard_rpcs : la migration 066 etait incomplete.
--
-- REVOKE FROM anon seul ne suffit pas : Postgres donne EXECUTE TO PUBLIC
-- par defaut a la creation d'une function, et PUBLIC inclut anon. Du coup
-- les advisors continuaient a flagger anon_security_definer.
--
-- Fix : REVOKE EXECUTE FROM PUBLIC (qui retire de tout le monde) puis
-- regrant explicitement aux roles legitimes (authenticated + service_role).
-- Note : authenticated reste car le dashboard admin SSR tourne en role
-- authenticated avec le cookie user. requireAdmin() filtre au niveau Next.js.

DO $$
DECLARE
  fn_signature TEXT;
BEGIN
  FOR fn_signature IN
    SELECT format('%s(%s)', p.proname, pg_get_function_identity_arguments(p.oid))
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'checkout_abandonment_stats',
        'coaching_upsell_candidates',
        'conversion_cohorts',
        'cta_attribution',
        'customer_ltv',
        'dashboard_previous_month',
        'dunning_alert',
        'family_mrr',
        'hot_leads',
        'lead_magnet_funnel',
        'pipeline_velocity',
        'revenue_by_source'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', fn_signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', fn_signature);
  END LOOP;
END $$;
