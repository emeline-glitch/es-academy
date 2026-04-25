-- Bootstrap du template email "academy_welcome_with_family_gift" (envoyé par
-- le webhook Stripe + cron retry après un achat Academy).
--
-- Convertit l'ancien script scripts/seed-academy-welcome-template.mjs en
-- migration auto-appliquée. Évite l'oubli lors d'un rebuild from-scratch.
--
-- Stratégie ON CONFLICT :
--   - Si le template n'existe pas : INSERT (cas DB fresh).
--   - Si le template existe SANS la variable magic_link dans available_variables :
--     UPDATE pour ajouter le magic link d'activation (sinon le webhook tâche 3
--     génère un magic_link mais le template ne l'affiche pas).
--   - Si le template existe AVEC magic_link : SKIP (l'admin a déjà customisé
--     via /admin/emails/templates, on ne veut pas écraser son travail).
--
-- Cohérent avec la règle ZERO hardcoding : le contenu reste éditable depuis
-- l'admin après ce bootstrap, on n'écrase pas les modifs ultérieures.

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
  'academy_welcome_with_family_gift',
  'Bienvenue Academy + code cadeau Family',
  'Envoyé automatiquement par le webhook Stripe après un achat Academy (1x/3x/4x). Contient le lien d''activation magic link et le code FAMILYXXXX à coller sur /family pour obtenir 3 mois gratuits.',
  'Bienvenue dans ES Academy, ton code cadeau Family est dedans',
  $html$<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">

<h1 style="color: #1B4332; font-size: 26px;">Bienvenue {{prenom}} !</h1>

<p>Bravo pour ton inscription à <strong>ES Academy</strong> ({{payment_label}}). Tu as maintenant accès à la méthode complète, aux 60 outils et aux mises à jour à vie.</p>

<p style="background: #f5f1e8; padding: 20px; border-radius: 10px; margin: 25px 0;">
  <strong style="color: #1B4332;">1. Active ton compte en 1 clic</strong><br>
  Ton compte est créé à l'adresse <strong>{{email}}</strong>. Clique sur le bouton ci-dessous pour te connecter directement, sans mot de passe à retenir :<br><br>
  <a href="{{magic_link}}" style="background: #1B4332; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Activer mon compte</a>
  <br><br>
  <span style="font-size: 13px; color: #666;">Ce lien d'activation est valable 24h. Une fois connecté, tu pourras choisir ton mot de passe dans tes paramètres.</span>
</p>

<p style="background: #fef6ec; padding: 20px; border-radius: 10px; margin: 25px 0; border: 2px dashed #d4a24c;">
  <strong style="color: #1B4332;">2. Active tes 3 mois ES Family offerts</strong><br>
  Colle ce code sur la page ES Family pour activer tes 3 mois gratuits :<br><br>
  <span style="display: inline-block; background: #1B4332; color: #d4a24c; font-family: monospace; font-size: 22px; letter-spacing: 2px; padding: 12px 20px; border-radius: 8px; font-weight: bold;">{{family_gift_code}}</span><br><br>
  <a href="{{family_activation_url}}" style="background: #d4a24c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Activer mes 3 mois Family</a>
  <br><br>
  <span style="font-size: 13px; color: #666;">Ce code est personnel, utilisable une seule fois. À l'issue des 3 mois, ton abonnement se poursuit à 29€/mois, sans engagement, résiliable en 1 clic.</span>
</p>

<p>Dans ES Family tu retrouveras Emeline, les partenaires experts, les lives mensuels, les simulateurs, et surtout la communauté qui te fera passer de la théorie à l'action.</p>

<p>Si tu as la moindre question, réponds directement à ce mail.</p>

<p>À très vite,<br><strong>Emeline</strong></p>

<p style="font-size: 12px; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
  ES Academy · Holdem SASU · RCS Nanterre 920244563<br>
  Tu reçois ce mail suite à ton achat sur emeline-siron.fr.
</p>

</div>$html$,
  'Emeline Siron',
  'emeline@es-academy.fr',
  'emeline@es-academy.fr',
  '["prenom","email","family_gift_code","family_activation_url","payment_label","site_url","magic_link"]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  subject = EXCLUDED.subject,
  available_variables = EXCLUDED.available_variables,
  updated_at = now()
WHERE NOT (public.email_templates.available_variables ? 'magic_link');
