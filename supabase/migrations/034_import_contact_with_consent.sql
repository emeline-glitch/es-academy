-- RPC atomique pour l'import CSV admin de contacts.
--
-- Avant : src/app/api/admin/import-contacts/route.ts faisait batch upsert
-- avec écrasement des tags existants (commenté lignes 234-243 du code).
--
-- Après : 1 RPC par contact qui :
--   - upsert atomique avec merge tags + préservation status RGPD
--   - préserve primary_source / primary_source_detail (premier wins)
--   - garde alumni_evermind=true si déjà set, accepte si nouveau
--   - garde rgpd_cohort si déjà set
--   - log consent_log dans la même transaction (preuve RGPD CNIL)
--
-- Performance : 1 round-trip par contact. Pour 1900 alumni : ~20s acceptable
-- pour un import admin one-shot. Si volume plus large, optimiser via batch
-- INSERT...SELECT FROM UNNEST.

CREATE OR REPLACE FUNCTION public.import_contact_with_consent(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT,
  p_add_tags TEXT[],
  p_source TEXT,
  p_primary_source TEXT,
  p_primary_source_detail TEXT,
  p_is_alumni BOOLEAN,
  p_rgpd_cohort INTEGER,
  p_consent_type TEXT,
  p_consent_basis TEXT,
  p_consent_proof JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_contact_id UUID;
  v_now TIMESTAMPTZ := now();
BEGIN
  INSERT INTO public.contacts (
    email,
    first_name,
    last_name,
    phone,
    tags,
    source,
    primary_source,
    primary_source_detail,
    is_alumni_evermind,
    alumni_migrated_at,
    rgpd_cohort,
    status,
    subscribed_at,
    last_activity_at
  )
  VALUES (
    p_email,
    NULLIF(p_first_name, ''),
    NULLIF(p_last_name, ''),
    NULLIF(p_phone, ''),
    (SELECT array_agg(DISTINCT t ORDER BY t) FROM unnest(COALESCE(p_add_tags, ARRAY[]::TEXT[])) AS t),
    p_source,
    p_primary_source,
    NULLIF(p_primary_source_detail, ''),
    COALESCE(p_is_alumni, false),
    CASE WHEN COALESCE(p_is_alumni, false) THEN v_now ELSE NULL END,
    p_rgpd_cohort,
    'active',
    v_now,
    v_now
  )
  ON CONFLICT (email) DO UPDATE SET
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.contacts.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.contacts.last_name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.contacts.phone),
    tags = (
      SELECT array_agg(DISTINCT t ORDER BY t)
      FROM unnest(
        COALESCE(public.contacts.tags, ARRAY[]::TEXT[]) ||
        COALESCE(p_add_tags, ARRAY[]::TEXT[])
      ) AS t
    ),
    source = COALESCE(EXCLUDED.source, public.contacts.source),
    primary_source = COALESCE(public.contacts.primary_source, EXCLUDED.primary_source),
    primary_source_detail = COALESCE(public.contacts.primary_source_detail, EXCLUDED.primary_source_detail),
    is_alumni_evermind = public.contacts.is_alumni_evermind OR COALESCE(EXCLUDED.is_alumni_evermind, false),
    alumni_migrated_at = COALESCE(public.contacts.alumni_migrated_at, EXCLUDED.alumni_migrated_at),
    rgpd_cohort = COALESCE(public.contacts.rgpd_cohort, EXCLUDED.rgpd_cohort),
    status = CASE
      WHEN public.contacts.status = 'unsubscribed' THEN 'unsubscribed'
      WHEN public.contacts.status = 'lead' THEN 'active'
      ELSE public.contacts.status
    END,
    last_activity_at = EXCLUDED.last_activity_at
  RETURNING id INTO v_contact_id;

  INSERT INTO public.consent_log (contact_id, consent_type, consent_basis, consent_proof)
  VALUES (
    v_contact_id,
    p_consent_type,
    NULLIF(p_consent_basis, ''),
    p_consent_proof
  );

  RETURN v_contact_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.import_contact_with_consent(
  TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, BOOLEAN, INTEGER, TEXT, TEXT, JSONB
) TO service_role;
