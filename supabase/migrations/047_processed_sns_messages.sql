-- Migration 047 : table d'idempotence webhook SNS (SES bounces / complaints)
--
-- AWS SNS rejoue les messages en cas de 5xx / timeout / network blip.
-- Sans dedup, le 2e traitement creerait des doublons dans consent_log et
-- audit_log, et pourrait re-flagger un contact deja restaure manuellement.
--
-- Pattern : INSERT en debut du webhook. Si PK conflict 23505 -> on a deja
-- traite ce MessageId, on return 200 sans rien faire de plus.

CREATE TABLE IF NOT EXISTS public.processed_sns_messages (
  message_id text PRIMARY KEY,
  topic_arn text NOT NULL,
  notification_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS processed_sns_messages_processed_at_idx
  ON public.processed_sns_messages (processed_at DESC);

CREATE INDEX IF NOT EXISTS processed_sns_messages_topic_arn_idx
  ON public.processed_sns_messages (topic_arn, processed_at DESC);

-- Table service-side uniquement (webhook utilise service role, pas de lecture client).
ALTER TABLE public.processed_sns_messages ENABLE ROW LEVEL SECURITY;
-- Pas de policy : service_role bypass de toute facon.
