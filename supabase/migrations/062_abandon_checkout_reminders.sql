-- 062_abandon_checkout_reminders : relances email auto J+1 / J+3 / J+7 pour
-- les checkouts abandonnes (pending depuis >24h sans completion).
--
-- Modele :
-- - 3 colonnes reminder_jX_sent_at sur checkout_attempts pour idempotence
-- - 3 templates email_templates (abandon_checkout_j1/j3/j7) editables par
--   Tiffany depuis /admin/emails/templates
-- - 1 cron pg_cron quotidien (10h UTC) qui appelle /api/cron/abandon-reminders
-- - L'endpoint Next.js fait le tri par fenetre temporelle, fetch Stripe pour
--   recuperer l'email si manquant, et send via SES

-- 1. Colonnes de tracking sur checkout_attempts
ALTER TABLE public.checkout_attempts
  ADD COLUMN IF NOT EXISTS reminder_j1_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_j3_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_j7_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_checkout_attempts_reminder_j1
  ON public.checkout_attempts(status, created_at)
  WHERE reminder_j1_sent_at IS NULL AND status = 'pending';

-- 2. 3 templates email pour Tiffany (editables ensuite via admin)
INSERT INTO public.email_templates (
  key, name, description, subject, html_content,
  from_name, from_email, reply_to, available_variables
)
VALUES
(
  'abandon_checkout_j1',
  'Abandon checkout J+1',
  'Relance 24h apres une session Stripe Checkout non finalisee. Variables : prenom, product (Academy/Family), plan, recovery_url.',
  'Tu as commencé l''inscription, on continue ?',
  '<p>Bonjour {{ .prenom }},</p>
<p>J''ai vu que tu as commencé ton inscription à <strong>{{ .product }}</strong> hier, et que tu n''es pas allé au bout.</p>
<p>Tout va bien ? Si quelque chose t''a bloqué (paiement, doute, question), réponds à ce mail, je suis là.</p>
<p>Si c''est juste que tu as été interrompu, voici le lien direct pour reprendre où tu en étais :</p>
<p><a href="{{ .recovery_url }}" style="display: inline-block; padding: 12px 24px; background: #1B4332; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Finaliser mon inscription</a></p>
<p>À très vite,<br/>Emeline</p>',
  'Emeline Siron',
  'emeline@emeline-siron.fr',
  'emeline@emeline-siron.fr',
  '["prenom","product","plan","recovery_url"]'::jsonb
),
(
  'abandon_checkout_j3',
  'Abandon checkout J+3',
  'Relance 72h apres une session Stripe Checkout non finalisee. Ton plus direct. Variables : prenom, product, plan, recovery_url.',
  'Une dernière question avant de te lancer ?',
  '<p>Bonjour {{ .prenom }},</p>
<p>Tu as commencé ton inscription à <strong>{{ .product }}</strong> il y a quelques jours.</p>
<p>Je me permets de revenir vers toi parce que la plupart des personnes qui hésitent ont juste UNE question qui les bloque. La tienne, c''est quoi ?</p>
<ul>
  <li>Tu te demandes si c''est le bon moment pour toi ?</li>
  <li>Tu as un doute sur le prix ou les modalités de paiement ?</li>
  <li>Tu veux savoir ce qui est inclus exactement ?</li>
</ul>
<p>Réponds à ce mail, je te réponds personnellement.</p>
<p>Et si tu es prêt, voici le lien direct :</p>
<p><a href="{{ .recovery_url }}" style="display: inline-block; padding: 12px 24px; background: #1B4332; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reprendre mon inscription</a></p>
<p>Emeline</p>',
  'Emeline Siron',
  'emeline@emeline-siron.fr',
  'emeline@emeline-siron.fr',
  '["prenom","product","plan","recovery_url"]'::jsonb
),
(
  'abandon_checkout_j7',
  'Abandon checkout J+7',
  'Derniere relance 7j apres, ton soft sans pression. Variables : prenom, product, plan, recovery_url.',
  'Tu as toujours envie d''investir dans {{ .product }} ?',
  '<p>Bonjour {{ .prenom }},</p>
<p>Il y a une semaine, tu as commencé à t''inscrire à <strong>{{ .product }}</strong>. Tu ne l''as finalement pas fait, et c''est très bien : on n''achète que quand on est prêt.</p>
<p>Je voulais juste te dire deux choses :</p>
<p><strong>1.</strong> Si la formation t''intéresse toujours, le lien est encore là :</p>
<p><a href="{{ .recovery_url }}" style="display: inline-block; padding: 12px 24px; background: #1B4332; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Voir l''offre</a></p>
<p><strong>2.</strong> Si ce n''est pas pour toi maintenant, pas de souci : tu peux te désinscrire de mes mails en bas, ou simplement ignorer celui-ci. Je ne reviendrai pas vers toi sur ce sujet.</p>
<p>Belle suite à toi,<br/>Emeline</p>',
  'Emeline Siron',
  'emeline@emeline-siron.fr',
  'emeline@emeline-siron.fr',
  '["prenom","product","plan","recovery_url"]'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 3. Cron pg_cron quotidien (10h UTC = 11h ou 12h Paris selon saison)
DO $$
BEGIN
  PERFORM cron.unschedule('es-academy-abandon-reminders')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'es-academy-abandon-reminders');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'es-academy-abandon-reminders',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://emeline-siron.fr/api/cron/abandon-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
