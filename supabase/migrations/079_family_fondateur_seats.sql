-- 079_family_fondateur_seats : compteur places fondateur restantes.
--
-- Cap defini cote env (STRIPE_FAMILY_FONDATEUR_CAP=500), mais on l'expose
-- aussi dans la RPC pour avoir une source de verite SQL et pouvoir l'ajuster
-- sans redeploiement (en mettant a jour CAP via SECURITY DEFINER ou config).
--
-- Une place est "occupee" si family_subscriptions.plan='fondateur' ET status
-- est dans ('active', 'trialing'). Un membre qui churn libere sa place.
-- (Comportement : si quelqu'un revient apres avoir churn, il sera nouveau
-- fondateur si seats_left > 0, sinon standard a 29 EUR.)

CREATE OR REPLACE FUNCTION public.family_fondateur_seats_left()
RETURNS TABLE (
  cap INT,
  taken INT,
  seats_left INT,
  sold_out BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH config AS (
    SELECT 500::INT AS cap  -- aligne sur STRIPE_FAMILY_FONDATEUR_CAP (env.local)
  ),
  active_fondateurs AS (
    SELECT COUNT(*)::INT AS taken
    FROM public.family_subscriptions
    WHERE plan = 'fondateur'
      AND status IN ('active', 'trialing')
  )
  SELECT
    c.cap,
    af.taken,
    GREATEST(0, c.cap - af.taken) AS seats_left,
    (af.taken >= c.cap) AS sold_out
  FROM config c, active_fondateurs af;
$$;

-- Accessible en lecture par tous (la valeur est publique : affichee sur /family).
GRANT EXECUTE ON FUNCTION public.family_fondateur_seats_left() TO anon, authenticated, service_role;
