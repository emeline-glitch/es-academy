-- RPC d'agrégation pour /admin/tunnels : compte les captures par tag et les ventes par produit
-- en 1 appel au lieu de charger toutes les lignes côté app.
CREATE OR REPLACE FUNCTION public.tunnels_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'captures_by_tag', (
      SELECT COALESCE(jsonb_object_agg(tag, n), '{}'::jsonb)
      FROM (
        SELECT tag, count(*) AS n
        FROM public.contacts, unnest(tags) AS tag
        WHERE status = 'active'
        GROUP BY tag
      ) t
    ),
    'sales_by_product', (
      SELECT COALESCE(jsonb_object_agg(product_name, jsonb_build_object('count', cnt, 'revenue', rev)), '{}'::jsonb)
      FROM (
        SELECT product_name, count(*) AS cnt, COALESCE(sum(amount_paid), 0) AS rev
        FROM public.enrollments
        WHERE product_name IS NOT NULL
        GROUP BY product_name
      ) p
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.tunnels_stats() TO authenticated, service_role;
