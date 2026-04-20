-- email_campaigns_status_check actuel n'accepte que {draft, scheduled, sending, sent}
-- mais l'API peut setter 'failed' (si envoi total échoue) et 'archived' (UI)
-- → drop + recreate avec la whitelist complète.

ALTER TABLE public.email_campaigns DROP CONSTRAINT IF EXISTS email_campaigns_status_check;

ALTER TABLE public.email_campaigns
  ADD CONSTRAINT email_campaigns_status_check
  CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'archived', 'test'));

-- 'test' est utilisé par /api/emails/send-test pour les envois de test.
