-- Migration 038 : table family_subscriptions
--
-- Stocke les abonnements ES Family (mode subscription Stripe : 19 EUR/mois
-- fondateur ou 29 EUR/mois standard). Distincte de la table enrollments,
-- qui est dediee aux formations Academy (one-shot ou 3x/4x payment).
--
-- Le webhook Stripe (api/stripe/webhook/route.ts) y persiste les rows
-- declenchees par checkout.session.completed avec metadata.scope = "family".

CREATE TABLE IF NOT EXISTS public.family_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_session_id text,
  plan text NOT NULL CHECK (plan IN ('fondateur', 'standard')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid')),
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,

  welcome_email_sent_at timestamptz,
  welcome_email_attempts integer NOT NULL DEFAULT 0,
  welcome_email_last_error text,
  welcome_email_last_attempt_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1 abo Family par user (resilier puis re-souscrire = update de la meme row).
CREATE UNIQUE INDEX IF NOT EXISTS family_subscriptions_user_unique
  ON public.family_subscriptions(user_id);

-- Idempotence webhook : meme stripe_session_id ne doit pas creer 2 rows.
CREATE UNIQUE INDEX IF NOT EXISTS family_subscriptions_session_unique
  ON public.family_subscriptions(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS family_subscriptions_subscription_idx
  ON public.family_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS family_subscriptions_status_idx
  ON public.family_subscriptions(status);

-- Auto-update updated_at sur chaque UPDATE.
CREATE OR REPLACE FUNCTION update_family_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS family_subscriptions_updated_at ON public.family_subscriptions;
CREATE TRIGGER family_subscriptions_updated_at
  BEFORE UPDATE ON public.family_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_family_subscriptions_updated_at();

-- RLS : table service-side uniquement (le webhook Stripe utilise service role,
-- les pages /admin aussi). Les users finaux ne lisent JAMAIS leur subscription
-- depuis le client (toujours via une route API server-side).
ALTER TABLE public.family_subscriptions ENABLE ROW LEVEL SECURITY;
-- Pas de policy CREATE = personne ne peut INSERT/UPDATE/SELECT depuis le client
-- (le service role bypass RLS de toute facon).
