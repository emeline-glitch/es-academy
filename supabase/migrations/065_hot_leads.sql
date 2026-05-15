-- 065_hot_leads : detection des leads "chauds" pour Antony.
--
-- Definition d'un lead chaud : un email qui a clique au moins 3 CTAs DISTINCTS
-- dans les 24 dernieres heures, ET qui n'est pas deja client (tag "client"
-- absent). C'est le signal le plus fort qu'on a aujourd'hui qu'un prospect
-- est en mode "decouverte intense" et merite un appel a chaud.
--
-- Pour ne pas appeler 5 fois la meme personne, le contact apparait pendant
-- 24h dans la liste puis disparait naturellement. Si Antony veut le marquer
-- comme contacte, il peut deplacer la carte dans pipeline_stage='rdv_pris'
-- depuis /admin/pipeline.

CREATE OR REPLACE FUNCTION public.hot_leads(min_distinct_ctas INT DEFAULT 3, since_hours INT DEFAULT 24)
RETURNS TABLE (
  email TEXT,
  contact_id UUID,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  distinct_ctas BIGINT,
  total_clicks BIGINT,
  cta_ids TEXT[],
  first_click_at TIMESTAMPTZ,
  last_click_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH activity AS (
    SELECT
      LOWER(cc.email) AS email_lc,
      cc.cta_id,
      cc.created_at
    FROM public.cta_clicks cc
    WHERE cc.email IS NOT NULL
      AND cc.created_at >= NOW() - (since_hours || ' hours')::interval
  ),
  aggregated AS (
    SELECT
      email_lc,
      COUNT(DISTINCT cta_id) AS distinct_ctas,
      COUNT(*) AS total_clicks,
      array_agg(DISTINCT cta_id ORDER BY cta_id) AS cta_ids,
      MIN(created_at) AS first_click_at,
      MAX(created_at) AS last_click_at
    FROM activity
    GROUP BY email_lc
    HAVING COUNT(DISTINCT cta_id) >= min_distinct_ctas
  )
  SELECT
    a.email_lc AS email,
    c.id AS contact_id,
    c.first_name,
    c.last_name,
    c.phone,
    a.distinct_ctas,
    a.total_clicks,
    a.cta_ids,
    a.first_click_at,
    a.last_click_at
  FROM aggregated a
  LEFT JOIN public.contacts c ON LOWER(c.email) = a.email_lc
  -- Pas deja client : pas de tag "client" sur le contact (ou contact pas
  -- encore dans le CRM)
  WHERE NOT (COALESCE(c.tags, ARRAY[]::TEXT[]) @> ARRAY['client'])
  ORDER BY a.distinct_ctas DESC, a.last_click_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.hot_leads(INT, INT) TO authenticated, service_role;
