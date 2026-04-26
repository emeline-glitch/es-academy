-- Idempotence du handler invoice.payment_failed.
--
-- Sans cette table, si Stripe retry l'event sur 5xx, le client reçoit le mail
-- dunning en double (rare car les retries sont espacés, mais possible).
--
-- Stratégie : check dédup AVANT envoi mail. Insert APRÈS envoi réussi seulement.
-- Si le serveur crash entre envoi et insert → retry → doublon possible.
-- Acceptable car la fenêtre est très courte vs l'espacement des retries Stripe.

CREATE TABLE IF NOT EXISTS public.processed_dunning_invoices (
  stripe_invoice_id TEXT PRIMARY KEY,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  email TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  amount_due_cents INTEGER,
  ses_success BOOLEAN NOT NULL DEFAULT false,
  ses_error TEXT,
  processed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processed_dunning_processed_at
  ON public.processed_dunning_invoices(processed_at DESC);

GRANT SELECT, INSERT ON public.processed_dunning_invoices TO service_role;
