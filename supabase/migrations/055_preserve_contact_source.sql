-- 055_preserve_contact_source : la source d'acquisition ne doit JAMAIS etre
-- ecrasee par un upsert posterieur. Aujourd'hui le webhook Stripe passe
-- p_source="stripe" et ecrase la vraie source (newsletter, podcast, etc.)
-- ce qui fausse l'attribution CRM.
--
-- Logique nouvelle :
--   - Si le contact n'a pas encore de source -> on prend la nouvelle
--   - Si le contact a deja une source -> on la PRESERVE (immutable)
--
-- + nettoyage des contacts deja pollues par "stripe"/"purchase" :
--   on remet leur source a NULL si on n'a pas d'autre info, pour qu'un
--   prochain touchpoint puisse renseigner correctement.

-- 1. RPC : preserver la source existante
DROP FUNCTION IF EXISTS public.upsert_contact_with_tags(TEXT, TEXT, TEXT, TEXT[], TEXT);

CREATE OR REPLACE FUNCTION public.upsert_contact_with_tags(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_add_tags TEXT[],
  p_source TEXT
)
RETURNS TABLE (id UUID, previous_tags TEXT[])
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_previous_tags TEXT[];
  v_id UUID;
BEGIN
  SELECT c.id, c.tags INTO v_id, v_previous_tags
  FROM public.contacts c
  WHERE c.email = p_email;

  INSERT INTO public.contacts (
    email,
    first_name,
    last_name,
    tags,
    source,
    status
  )
  VALUES (
    p_email,
    NULLIF(p_first_name, ''),
    NULLIF(p_last_name, ''),
    (SELECT array_agg(DISTINCT t ORDER BY t) FROM unnest(COALESCE(p_add_tags, ARRAY[]::TEXT[])) AS t),
    p_source,
    'active'
  )
  ON CONFLICT (email) DO UPDATE SET
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.contacts.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.contacts.last_name),
    tags = (
      SELECT array_agg(DISTINCT t ORDER BY t)
      FROM unnest(
        COALESCE(public.contacts.tags, ARRAY[]::TEXT[]) ||
        COALESCE(p_add_tags, ARRAY[]::TEXT[])
      ) AS t
    ),
    -- INVERSE de l'ancienne logique : on garde la source existante en priorite.
    -- La source d'acquisition est immuable une fois posee : c'est l'origine
    -- du lead, pas le dernier touchpoint.
    source = COALESCE(public.contacts.source, EXCLUDED.source),
    status = CASE
      WHEN public.contacts.status = 'unsubscribed' THEN 'unsubscribed'
      WHEN public.contacts.status = 'lead' THEN 'active'
      ELSE public.contacts.status
    END
  RETURNING public.contacts.id INTO v_id;

  RETURN QUERY SELECT v_id, COALESCE(v_previous_tags, ARRAY[]::TEXT[]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_contact_with_tags(TEXT, TEXT, TEXT, TEXT[], TEXT) TO authenticated, service_role;

-- 2. Nettoyage des contacts pollues : source="stripe" ou source="purchase"
--    n'est pas une source d'acquisition, c'est un canal de paiement. On reset
--    pour que l'attribution future puisse les renseigner correctement.
UPDATE public.contacts
SET source = NULL
WHERE source IN ('stripe', 'purchase');
