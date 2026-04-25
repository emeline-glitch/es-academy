-- Bootstrap du template email "academy_dunning_payment_failed" envoyé quand
-- une mensualité 3x/4x Academy échoue (carte expirée, fonds insuffisants...).
--
-- Stripe gère le smart retry automatique sur 7 jours. Notre mail informe le
-- client + l'invite à mettre à jour sa carte sur le hosted_invoice_url Stripe
-- pour éviter que la subscription soit cancel par Stripe à la fin des retries.
--
-- Stratégie ON CONFLICT : INSERT si absent, sinon SKIP (l'admin peut customiser
-- via /admin/emails/templates).

INSERT INTO public.email_templates (
  key,
  name,
  description,
  subject,
  html_content,
  from_name,
  from_email,
  reply_to,
  available_variables
)
VALUES (
  'academy_dunning_payment_failed',
  'Academy : échec mensualité 3x ou 4x (dunning)',
  'Envoyé automatiquement par le webhook Stripe sur invoice.payment_failed pour les subscriptions Academy 3x ou 4x. Invite le client à mettre à jour sa carte avant que Stripe annule la subscription.',
  'Ta mensualité Academy n''a pas pu être prélevée',
  $html$<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">

<h1 style="color: #1B4332; font-size: 24px;">Bonjour {{prenom}},</h1>

<p>Ta mensualité ES Academy de <strong>{{amount}}€</strong> n'a pas pu être prélevée aujourd'hui ({{attempt_date}}).</p>

<p>Pas de panique : ton accès Academy reste actif. Stripe va retenter automatiquement le paiement dans les prochains jours, mais tu peux aussi mettre à jour ta carte tout de suite pour ne pas attendre.</p>

<p style="background: #fef6ec; padding: 20px; border-radius: 10px; margin: 25px 0; border: 2px dashed #d4a24c;">
  <strong style="color: #1B4332;">Mettre à jour ma carte ou payer manuellement</strong><br><br>
  <a href="{{invoice_url}}" style="background: #d4a24c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Régler maintenant</a>
  <br><br>
  <span style="font-size: 13px; color: #666;">Lien sécurisé Stripe. Tu pourras y voir la facture, mettre à jour ta carte ou payer en 1 clic.</span>
</p>

<p>Si après plusieurs tentatives la carte ne passe toujours pas, ta subscription sera automatiquement annulée par Stripe et tu perdras l'accès Academy. Pour éviter ça, fais un tour sur le lien ci-dessus dès que possible.</p>

<p>Si tu rencontres un souci ou que tu veux qu'on en discute, réponds directement à ce mail.</p>

<p>À très vite,<br><strong>Emeline</strong></p>

<p style="font-size: 12px; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
  ES Academy · Holdem SASU · RCS Nanterre 920244563<br>
  Tu reçois ce mail car ta carte a été refusée pour une mensualité de ton paiement Academy en {{installments}}x.
</p>

</div>$html$,
  'Emeline Siron',
  'emeline@es-academy.fr',
  'emeline@es-academy.fr',
  '["prenom","email","amount","attempt_date","invoice_url","installments"]'::jsonb
)
ON CONFLICT (key) DO NOTHING;
