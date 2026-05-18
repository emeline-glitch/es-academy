-- 078_team_compensation : RPC qui calcule les commissions dues pour un
-- membre de l'equipe (Tiffany ou Antony) sur une periode donnee.
--
-- Base sur les contrats freelance signes 2026-05 (en vigueur juin-nov 2026) :
--
-- Tiffany (Marketing) :
--   - Fixe 2000€ HT/mois (uniquement entre 2026-06-01 et 2026-11-30)
--   - Variable Academy 3% HT sur enrollments dont contact.tags inclut lm:*
--   - Variable Family 7€ HT par nouveau membre acquis via tag lm:*, actif M+2
--   - Exclus : coaching, Family auto
--
-- Antony (Closer) :
--   - 100% variable, pas de fixe
--   - 15% HT sur enrollments product=academy dont contact.tags inclut closer:antony
--   - 15% HT sur enrollments product=coaching idem
--   - 10% HT sur paiements Family des membres convertis par lui, max 12 mois/membre
--   - Exclus : Family auto via Academy

CREATE OR REPLACE FUNCTION public.team_compensation_for_member(
  p_member TEXT,           -- 'tiffany' ou 'antony'
  p_period_start DATE,      -- ex 2026-06-01
  p_period_end DATE         -- ex 2026-06-30 (inclus)
)
RETURNS TABLE (
  member TEXT,
  fixed_cents BIGINT,
  variable_academy_cents BIGINT,
  variable_coaching_cents BIGINT,
  variable_family_cents BIGINT,
  total_cents BIGINT,
  academy_sales_count INT,
  coaching_sales_count INT,
  family_new_members_count INT,
  family_active_members_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tag TEXT;
  v_pct_academy NUMERIC;
  v_pct_coaching NUMERIC;
  v_pct_family NUMERIC;
  v_fixe BIGINT := 0;
  v_eur_per_family INT := 0;
  v_period_start_ts TIMESTAMPTZ;
  v_period_end_ts TIMESTAMPTZ;
  v_academy_cents BIGINT := 0;
  v_coaching_cents BIGINT := 0;
  v_family_cents BIGINT := 0;
  v_academy_count INT := 0;
  v_coaching_count INT := 0;
  v_family_new_count INT := 0;
  v_family_active_count INT := 0;
BEGIN
  v_period_start_ts := p_period_start::TIMESTAMPTZ;
  v_period_end_ts := (p_period_end + INTERVAL '1 day')::TIMESTAMPTZ;

  -- Configuration par membre
  IF lower(p_member) = 'tiffany' THEN
    v_tag := 'lm:%';
    v_pct_academy := 0.03;
    v_pct_coaching := 0;          -- pas de commission coaching
    v_pct_family := 0;            -- Tiffany : 7€ flat, pas un %
    v_eur_per_family := 7;
    -- Fixe Tiffany : 2000€/mois uniquement entre juin et nov 2026 (cf contrat)
    IF p_period_start <= '2026-11-30'::DATE AND p_period_end >= '2026-06-01'::DATE THEN
      v_fixe := 200000;  -- 2000€ = 200 000 cents
    END IF;
  ELSIF lower(p_member) = 'antony' THEN
    v_tag := 'closer:antony';
    v_pct_academy := 0.15;
    v_pct_coaching := 0.15;
    v_pct_family := 0.10;
    v_eur_per_family := 0;
    v_fixe := 0;
  ELSE
    RAISE EXCEPTION 'Membre inconnu: %', p_member;
  END IF;

  -- Variable Academy (HT) : enrollments product='academy' dans la periode
  -- avec contact ayant un tag eligible. Le contact CRM est rattache via
  -- profiles.email -> contacts.email (1-to-1 en pratique).
  WITH academy_attrib AS (
    SELECT e.amount_paid
    FROM public.enrollments e
    JOIN public.profiles p ON p.id = e.user_id
    JOIN public.contacts c ON LOWER(c.email) = LOWER(p.email)
    WHERE e.product_name = 'academy'
      AND e.purchased_at >= v_period_start_ts
      AND e.purchased_at < v_period_end_ts
      AND (
        (lower(p_member) = 'antony' AND v_tag = ANY(c.tags))
        OR
        (lower(p_member) = 'tiffany' AND EXISTS (
          SELECT 1 FROM unnest(c.tags) AS t WHERE t LIKE v_tag
        ))
      )
  )
  SELECT
    COALESCE(SUM(FLOOR(amount_paid / 1.20 * v_pct_academy)), 0)::BIGINT,
    COUNT(*)::INT
  INTO v_academy_cents, v_academy_count
  FROM academy_attrib;

  -- Variable Coaching (HT, Antony only - Tiffany a 0%)
  IF v_pct_coaching > 0 THEN
    WITH coaching_attrib AS (
      SELECT e.amount_paid
      FROM public.enrollments e
      JOIN public.profiles p ON p.id = e.user_id
      JOIN public.contacts c ON LOWER(c.email) = LOWER(p.email)
      WHERE e.product_name = 'coaching'
        AND e.purchased_at >= v_period_start_ts
        AND e.purchased_at < v_period_end_ts
        AND v_tag = ANY(c.tags)
    )
    SELECT
      COALESCE(SUM(FLOOR(amount_paid / 1.20 * v_pct_coaching)), 0)::BIGINT,
      COUNT(*)::INT
    INTO v_coaching_cents, v_coaching_count
    FROM coaching_attrib;
  END IF;

  -- Variable Family
  --
  -- Antony : 10% HT sur paiements Family des membres qu'il a convertis,
  --          pendant max 12 mois par membre, stop si churn.
  --          Pour l'estimation mensuelle, on compte le MRR des membres
  --          actifs (status IN trialing/active) avec tag closer:antony,
  --          dont la subscription a < 12 mois.
  --
  -- Tiffany : 7€ HT flat par NOUVEAU membre acquis dans la periode via
  --          tag lm:*, et toujours actif a la fin de la periode.
  IF lower(p_member) = 'antony' THEN
    WITH antony_family AS (
      SELECT
        fs.id,
        -- Prix mensuel HT (TTC -> HT via /1.20). Plan fondateur=19€ TTC, standard=29€ TTC.
        CASE fs.plan
          WHEN 'fondateur' THEN 1900::BIGINT
          WHEN 'standard'  THEN 2900::BIGINT
          ELSE 1900::BIGINT
        END AS price_cents
      FROM public.family_subscriptions fs
      JOIN public.profiles p ON p.id = fs.user_id
      JOIN public.contacts c ON LOWER(c.email) = LOWER(p.email)
      WHERE fs.status IN ('active', 'trialing')
        AND fs.created_at >= v_period_start_ts - INTERVAL '12 months'
        AND fs.created_at < v_period_end_ts
        AND v_tag = ANY(c.tags)
    )
    SELECT
      COALESCE(SUM(FLOOR(price_cents / 1.20 * v_pct_family)), 0)::BIGINT,
      COUNT(*)::INT
    INTO v_family_cents, v_family_active_count
    FROM antony_family;

    -- Pour Antony, "nouveaux membres" du mois = ceux dont created_at dans la periode
    SELECT COUNT(*)::INT INTO v_family_new_count
    FROM public.family_subscriptions fs
    JOIN public.profiles p ON p.id = fs.user_id
    JOIN public.contacts c ON LOWER(c.email) = LOWER(p.email)
    WHERE fs.created_at >= v_period_start_ts
      AND fs.created_at < v_period_end_ts
      AND v_tag = ANY(c.tags);
  ELSE
    -- Tiffany : 7€ flat par nouveau membre encore actif a la fin periode
    -- Le contrat dit "actif a M+2" mais pour l'estimation immediate on
    -- prend les actifs maintenant. Le decompte definitif se fait a M+3.
    WITH tiffany_family AS (
      SELECT fs.id
      FROM public.family_subscriptions fs
      JOIN public.profiles p ON p.id = fs.user_id
      JOIN public.contacts c ON LOWER(c.email) = LOWER(p.email)
      WHERE fs.status IN ('active', 'trialing')
        AND fs.created_at >= v_period_start_ts
        AND fs.created_at < v_period_end_ts
        AND EXISTS (SELECT 1 FROM unnest(c.tags) AS t WHERE t LIKE v_tag)
    )
    SELECT COUNT(*)::INT INTO v_family_new_count FROM tiffany_family;
    v_family_active_count := v_family_new_count;
    v_family_cents := v_family_new_count * v_eur_per_family * 100; -- € → cents
  END IF;

  RETURN QUERY SELECT
    p_member::TEXT,
    v_fixe,
    v_academy_cents,
    v_coaching_cents,
    v_family_cents,
    (v_fixe + v_academy_cents + v_coaching_cents + v_family_cents)::BIGINT,
    v_academy_count,
    v_coaching_count,
    v_family_new_count,
    v_family_active_count;
END $$;

-- Restrict to authenticated (admin pages via service_role bypass aussi)
REVOKE EXECUTE ON FUNCTION public.team_compensation_for_member(TEXT, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.team_compensation_for_member(TEXT, DATE, DATE) TO authenticated, service_role;
