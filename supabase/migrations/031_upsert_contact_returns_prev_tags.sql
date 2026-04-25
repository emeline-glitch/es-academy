-- Étend RPC upsert_contact_with_tags pour retourner aussi les anciens tags.
-- Permet aux callers (forms/submit, videoask/webhook) de calculer les tags
-- "newly added" et déclencher autoEnrollByTags() seulement sur ceux-là.
--
-- Atomicité : on capture l'état pré-upsert dans une CTE qui s'exécute avant
-- l'INSERT...DO UPDATE. Le row lock pris par ON CONFLICT serialise toujours
-- les writes ; chaque caller voit son propre snapshot pre-state pour décider
-- de l'auto-enroll. autoEnrollByTags est déjà idempotent (UNIQUE
-- sequence_id,contact_id + ignoreDuplicates).
--
-- Le webhook Stripe ignorait déjà la valeur de retour, pas de breaking change.

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
AS $$
DECLARE
  v_previous_tags TEXT[];
  v_id UUID;
BEGIN
  -- Capture l'état pré-upsert (NULL si nouveau contact).
  SELECT c.id, c.tags INTO v_id, v_previous_tags
  FROM public.contacts c
  WHERE c.email = p_email;

  -- Upsert atomique avec merge des tags + préservation status RGPD.
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
    source = COALESCE(EXCLUDED.source, public.contacts.source),
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
