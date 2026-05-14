-- 057_enrollments_vat : ajoute la notion HT/TTC sur les enrollments.
--
-- Contexte : ES Academy SASU collecte la TVA 20% standard. Aujourd'hui
-- amount_paid stocke le TTC, sans distinction HT/TVA, ce qui rend les
-- analyses compta floues (CA TTC ≠ CA HT pour le revenu reel).
--
-- Choix : on garde amount_paid en TTC (pas de breaking change cote
-- webhook Stripe qui pousse le TTC). On ajoute vat_rate par enrollment
-- (permettant des taux differents selon le produit : 20% standard,
-- 10% formation pro si elle est CFA un jour, etc.) et une colonne
-- GENERATED ALWAYS AS amount_ht_cents calculee en SQL pour ne pas
-- avoir a recalculer cote code.

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.20;

-- Colonne generee : amount_ht_cents = floor(amount_paid / (1 + vat_rate))
-- floor au lieu de round pour ne jamais surestimer la base imposable.
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS amount_ht_cents INT GENERATED ALWAYS AS (
    FLOOR(amount_paid::numeric / (1 + vat_rate))::int
  ) STORED;

COMMENT ON COLUMN public.enrollments.vat_rate IS
  'Taux de TVA appliqué sur cet enrollment. 0.20 = 20% standard. 0 = pas de TVA (franchise).';
COMMENT ON COLUMN public.enrollments.amount_ht_cents IS
  'Montant HT en centimes calcule depuis amount_paid (TTC) et vat_rate. Auto-update.';

-- Idem family_subscriptions : on stocke le vat_rate par sub pour le
-- jour ou Emeline a un mix de plans avec taux differents.
ALTER TABLE public.family_subscriptions
  ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.20;
