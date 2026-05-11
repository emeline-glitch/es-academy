-- 044 : Active RLS sur 4 tables critiques qui en etaient depourvues
--
-- Audit du 2026-05-08 a identifie 4 tables sensibles sans Row Level
-- Security : un user authentifie pouvait theoriquement lire/modifier
-- ces tables via le client public en bypassant les API routes admin.
--
-- Le webhook Stripe et les crons utilisent createServiceClient() qui
-- bypasse RLS automatiquement, donc cette migration n'affecte PAS leur
-- fonctionnement. Elle bloque uniquement les acces directs via le
-- client cookie/anon.
--
-- Pattern utilise : EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
-- AND role = 'admin') pour ALL ; coherent avec les policies existantes
-- (cf. 001_initial_schema.sql, 003_pipeline.sql).

-- ===== email_templates =====
-- Contient sujet + html_content + variables des mails transactionnels.
-- Acces leak = vol de templates marketing + edition possible de
-- l'envoi de mails.
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage email_templates" ON public.email_templates;
CREATE POLICY "Admin manage email_templates" ON public.email_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ===== processed_dunning_invoices =====
-- Contient stripe_invoice_id, email, amount_due_cents pour TOUS les
-- clients dont une mensualite Academy 3x/4x a echoue. Acces leak = liste
-- de clients en defaut de paiement + montants dus.
-- Le webhook utilise service_role (bypasse RLS) pour insert/select.
ALTER TABLE public.processed_dunning_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage processed_dunning_invoices" ON public.processed_dunning_invoices;
CREATE POLICY "Admin manage processed_dunning_invoices" ON public.processed_dunning_invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ===== billing_reminders =====
-- Contient stripe_customer_id + stripe_subscription_id de tous les Family
-- en periode trial. Acces leak = enumeration des clients Stripe.
ALTER TABLE public.billing_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage billing_reminders" ON public.billing_reminders;
CREATE POLICY "Admin manage billing_reminders" ON public.billing_reminders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ===== consent_log =====
-- Historique RGPD complet (qui a opt-in/out a quoi, quand). Donnees
-- legalement sensibles. Acces leak = violation CNIL potentielle.
ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage consent_log" ON public.consent_log;
CREATE POLICY "Admin manage consent_log" ON public.consent_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ===== Tables IMPORTANT (pas critiques mais a durcir) =====
-- quiz_responses : profils prospects (tu_perds_argent, etc.). Acces auth.
-- contact_events : tracking comportemental complet des contacts.
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage quiz_responses" ON public.quiz_responses;
CREATE POLICY "Admin manage quiz_responses" ON public.quiz_responses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE public.contact_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage contact_events" ON public.contact_events;
CREATE POLICY "Admin manage contact_events" ON public.contact_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
