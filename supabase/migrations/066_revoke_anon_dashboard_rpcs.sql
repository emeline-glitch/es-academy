-- 066_revoke_anon_dashboard_rpcs : durcissement securite des RPCs business.
--
-- Probleme detecte par les advisors Supabase : 12 RPCs SECURITY DEFINER
-- des migrations 056 a 065 sont accessibles a `anon` (utilisateur non
-- connecte) via /rest/v1/rpc/... Un visiteur anonyme du site pouvait
-- theoriquement scraper :
--   - hot_leads -> emails + telephones + prenoms des leads chauds
--   - revenue_by_source -> CA par canal d'acquisition
--   - customer_ltv -> LTV par segment client
--   - family_mrr -> MRR Family
--   - dunning_alert -> abos en echec paiement
--   - cta_attribution -> conversions par CTA
--   - lead_magnet_funnel -> CA par LM
--   - conversion_cohorts -> cohortes de conversion
--   - checkout_abandonment_stats -> CA perdu par abandon
--   - pipeline_velocity, coaching_upsell_candidates, dashboard_previous_month
--
-- Fix : REVOKE EXECUTE FROM anon sur ces 12 RPCs. authenticated est garde
-- car le dashboard admin tourne sous role authenticated (SSR avec cookie
-- user) + le middleware redirige les non-admin vers /connexion. Risque
-- residuel : un eleve authentifie pourrait appeler ces RPCs directement
-- via REST. A refondre plus tard avec un check is_admin() dans chaque RPC
-- si necessaire.
--
-- is_admin(uuid) garde l'acces a authenticated car c'est legitime (un
-- user peut verifier s'il est admin).

REVOKE EXECUTE ON FUNCTION public.checkout_abandonment_stats(INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.coaching_upsell_candidates() FROM anon;
REVOKE EXECUTE ON FUNCTION public.conversion_cohorts(INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cta_attribution(INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.customer_ltv() FROM anon;
REVOKE EXECUTE ON FUNCTION public.dashboard_previous_month() FROM anon;
REVOKE EXECUTE ON FUNCTION public.dunning_alert() FROM anon;
REVOKE EXECUTE ON FUNCTION public.family_mrr() FROM anon;
REVOKE EXECUTE ON FUNCTION public.hot_leads(INT, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.lead_magnet_funnel(INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.pipeline_velocity() FROM anon;
REVOKE EXECUTE ON FUNCTION public.revenue_by_source(INT) FROM anon;
