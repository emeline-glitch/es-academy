-- Migration 041 : table d'idempotence webhook Stripe
--
-- Stripe rejoue les webhook events en cas de timeout / 5xx / network blip
-- (parfois plusieurs fois). Sans dedup, le 2e traitement crée des doublons :
--  - 2 enrollments pour la meme session
--  - 2 family_subscriptions pour le meme abo
--  - 2 mails welcome envoyes au client
--
-- Pattern : INSERT-on-conflict en debut de chaque handler, si ligne deja
-- presente => on skip immediatement (return 200 sans rien faire).
--
-- Le meme schema doit exister cote Supabase Family (migration 021_processed_stripe_events).

CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  stripe_event_id text PRIMARY KEY,
  event_type text NOT NULL,
  scope text,                                  -- 'academy', 'family', etc. (selon metadata.scope)
  processed_at timestamptz NOT NULL DEFAULT now(),
  -- Champ libre pour debug : payload extrait minimal (ex: customer_id, session_id)
  meta jsonb DEFAULT '{}'::jsonb
);

-- Index pour retro-analyse temporelle (rare mais util quand on debug
-- un retry pathologique de Stripe sur une journee).
CREATE INDEX IF NOT EXISTS processed_stripe_events_processed_at_idx
  ON public.processed_stripe_events (processed_at DESC);

-- RLS : table service-side uniquement (le webhook utilise service role,
-- aucune lecture cote client).
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;
-- Pas de policy = aucun acces depuis le client (service role bypass de toute facon).
