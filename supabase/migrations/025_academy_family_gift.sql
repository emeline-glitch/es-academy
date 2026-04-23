-- Phase 1 Stripe : paiement Academy 1x/3x/4x + génération code cadeau Family
-- À l'achat Academy, le webhook génère un code promo unique "FAMILYXXXX" (enfant du
-- coupon parent ACADEMY_3_MOIS_FAMILY) et l'envoie par mail. Le client l'utilisera
-- plus tard sur /family pour activer ses 3 mois offerts.

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS installments INTEGER NOT NULL DEFAULT 1
    CHECK (installments IN (1, 3, 4)),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS family_gift_code TEXT,
  ADD COLUMN IF NOT EXISTS family_gift_stripe_promo_id TEXT,
  ADD COLUMN IF NOT EXISTS family_gift_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS family_gift_redeemed_at TIMESTAMPTZ;

-- Le code gift est unique par client (un par achat Academy)
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_family_gift_code
  ON public.enrollments(family_gift_code)
  WHERE family_gift_code IS NOT NULL;

-- Pour retrouver rapidement une subscription Stripe
CREATE INDEX IF NOT EXISTS idx_enrollments_stripe_subscription
  ON public.enrollments(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
