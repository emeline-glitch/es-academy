-- RPC atomique pour upsert d'un contact avec merge des tags + préservation du status.
--
-- Avant : upsertContactPreservingStatus dans src/app/api/stripe/webhook/route.ts
-- faisait read-modify-write côté client (SELECT puis UPDATE en 2 calls réseau).
-- Race condition : 2 webhooks Stripe concurrents sur le même email peuvent perdre
-- des tags (le 2e read voit l'état pré-1er-write, son merge écrase le 1er).
--
-- Après : INSERT ON CONFLICT DO UPDATE avec merge atomique côté Postgres. Le
-- row lock pris par ON CONFLICT sérialise les writes, plus de perte possible.

CREATE OR REPLACE FUNCTION public.upsert_contact_with_tags(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_add_tags TEXT[],
  p_source TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_contact_id UUID;
BEGIN
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
    -- Dedup même à l'INSERT pour le cas d'un caller qui passe ['x','x']
    (SELECT array_agg(DISTINCT t ORDER BY t) FROM unnest(COALESCE(p_add_tags, ARRAY[]::TEXT[])) AS t),
    p_source,
    'active'
  )
  ON CONFLICT (email) DO UPDATE SET
    -- COALESCE NULLIF : ne remplace pas un nom existant par une string vide,
    -- mais accepte un nouveau nom non vide.
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.contacts.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.contacts.last_name),
    -- Merge tags atomique : union(existing, add) sans doublons.
    tags = (
      SELECT array_agg(DISTINCT t ORDER BY t)
      FROM unnest(
        COALESCE(public.contacts.tags, ARRAY[]::TEXT[]) ||
        COALESCE(p_add_tags, ARRAY[]::TEXT[])
      ) AS t
    ),
    -- Source : on n'écrase la source d'origine que si la nouvelle est non null.
    source = COALESCE(EXCLUDED.source, public.contacts.source),
    -- Status RGPD : un contact unsubscribed ne se réactive JAMAIS via achat,
    -- il doit explicitement se réinscrire. Un lead devient client (active).
    status = CASE
      WHEN public.contacts.status = 'unsubscribed' THEN 'unsubscribed'
      WHEN public.contacts.status = 'lead' THEN 'active'
      ELSE public.contacts.status
    END
  RETURNING id INTO v_contact_id;

  RETURN v_contact_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_contact_with_tags(TEXT, TEXT, TEXT, TEXT[], TEXT) TO authenticated, service_role;
