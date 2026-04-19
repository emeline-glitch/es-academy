-- Champs pour newsletter Brevo-style : preview text, from name, from email
ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS preview_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS from_name TEXT,
  ADD COLUMN IF NOT EXISTS from_email TEXT,
  ADD COLUMN IF NOT EXISTS reply_to TEXT,
  ADD COLUMN IF NOT EXISTS campaign_number SERIAL;

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status_created
  ON public.email_campaigns (status, created_at DESC);
