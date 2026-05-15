-- 068_admin_sale_notification_template : template SES editable pour
-- notifier Emeline a chaque vente.
--
-- Envoye par le webhook Stripe checkout.session.completed (Academy et
-- Family) apres creation de l'enrollment. Permet a Emeline d'avoir un
-- signal temps reel sur les ventes (vs aller verifier le dashboard).
--
-- Variables disponibles : product (Academy / Family), plan (1x/3x/4x ou
-- fondateur/standard), amount_ttc, amount_ht, client_name, client_email,
-- source (newsletter, podcast, etc. si connue), enrollment_id, contact_url.

INSERT INTO public.email_templates (
  key, name, description, subject, html_content,
  from_name, from_email, reply_to, available_variables
)
VALUES (
  'admin_sale_notification',
  'Notification vente (admin)',
  'Email envoye a Emeline a chaque vente Stripe (Academy ou Family). Personnaliser le ton mais garder les variables : {{ .product }}, {{ .plan }}, {{ .amount_ttc }}, {{ .amount_ht }}, {{ .client_name }}, {{ .client_email }}, {{ .source }}, {{ .contact_url }}.',
  '🎉 Vente {{ .product }} · {{ .amount_ttc }}',
  '<p>Salut Emeline,</p>
<p>Bonne nouvelle : un nouveau client vient de finaliser un achat.</p>
<table style="border-collapse: collapse; margin: 16px 0;">
  <tr><td style="padding: 6px 12px 6px 0; color: #6b7280;">Produit</td><td style="padding: 6px 0; font-weight: 600;">{{ .product }}</td></tr>
  <tr><td style="padding: 6px 12px 6px 0; color: #6b7280;">Formule</td><td style="padding: 6px 0;">{{ .plan }}</td></tr>
  <tr><td style="padding: 6px 12px 6px 0; color: #6b7280;">Montant TTC</td><td style="padding: 6px 0; font-weight: 700; color: #1B4332;">{{ .amount_ttc }}</td></tr>
  <tr><td style="padding: 6px 12px 6px 0; color: #6b7280;">Montant HT</td><td style="padding: 6px 0; color: #525252;">{{ .amount_ht }}</td></tr>
  <tr><td style="padding: 6px 12px 6px 0; color: #6b7280;">Client</td><td style="padding: 6px 0;">{{ .client_name }} ({{ .client_email }})</td></tr>
  <tr><td style="padding: 6px 12px 6px 0; color: #6b7280;">Source</td><td style="padding: 6px 0; font-style: italic; color: #525252;">{{ .source }}</td></tr>
</table>
<p><a href="{{ .contact_url }}" style="display: inline-block; padding: 10px 20px; background: #1B4332; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Voir la fiche client</a></p>
<p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
Notification automatique depuis le webhook Stripe. Pour ne plus la recevoir,
edite ou supprime le template "admin_sale_notification" depuis /admin/emails/templates.
</p>',
  'ES Academy',
  'emeline@emeline-siron.fr',
  'emeline@emeline-siron.fr',
  '["product","plan","amount_ttc","amount_ht","client_name","client_email","source","contact_url","enrollment_id"]'::jsonb
)
ON CONFLICT (key) DO NOTHING;
