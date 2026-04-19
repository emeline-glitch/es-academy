-- RPC unique qui calcule toutes les stats du dashboard en 1 appel SQL (vs 11 requêtes + scans complets).
-- Remplace les SELECT * qui chargeaient toutes les lignes juste pour sommer côté JS.
CREATE OR REPLACE FUNCTION public.dashboard_stats(month_start timestamptz, today_start timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_profiles',     (SELECT count(*) FROM public.profiles),
    'total_contacts',     (SELECT count(*) FROM public.contacts),
    'today_contacts',     (SELECT count(*) FROM public.contacts WHERE subscribed_at >= today_start),
    'total_enrollments',  (SELECT count(*) FROM public.enrollments),
    'total_revenue',      (SELECT COALESCE(sum(amount_paid), 0) FROM public.enrollments),
    'month_revenue',      (SELECT COALESCE(sum(amount_paid), 0) FROM public.enrollments WHERE purchased_at >= month_start),
    'month_sales_count',  (SELECT count(*) FROM public.enrollments WHERE purchased_at >= month_start),
    'total_campaigns',    (SELECT count(*) FROM public.email_campaigns),
    'pipeline_counts',    (
      SELECT COALESCE(jsonb_object_agg(stage, n), '{}'::jsonb)
      FROM (
        SELECT COALESCE(pipeline_stage, 'leads') AS stage, count(*) AS n
        FROM public.contacts
        GROUP BY COALESCE(pipeline_stage, 'leads')
      ) s
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_stats(timestamptz, timestamptz) TO authenticated, service_role;
