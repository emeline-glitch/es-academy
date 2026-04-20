-- Table centralisée pour TOUS les emails transactionnels de la plateforme
-- (invitation élève, reset password, confirmation inscription, bienvenue achat…).
-- Admin édite le sujet + corps HTML depuis /admin/emails/templates au lieu de devoir
-- jongler entre Supabase dashboard et le code.

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,                    -- identifiant technique (ex: 'invite_student')
  name TEXT NOT NULL,                          -- nom lisible (ex: 'Bascule contact → élève')
  description TEXT,                            -- quand ce mail est envoyé
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  from_name TEXT DEFAULT 'Emeline Siron',
  from_email TEXT DEFAULT 'emeline@es-academy.fr',
  reply_to TEXT,
  available_variables JSONB DEFAULT '[]'::jsonb, -- liste des variables dispo pour ce template
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_key ON public.email_templates(key);

-- Trigger auto-update
DROP TRIGGER IF EXISTS email_templates_updated_at ON public.email_templates;
CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed des templates par défaut
INSERT INTO public.email_templates (key, name, description, subject, html_content, available_variables) VALUES
(
  'invite_student',
  'Bascule contact → élève',
  'Envoyé à la création du compte élève depuis la modale "Basculer en élève" du CRM.',
  'Bienvenue dans ES Academy 🎓',
  '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833;">
  <h1 style="color: #1B4332; font-size: 26px;">Bienvenue {{prenom}} !</h1>
  <p>Je suis ravie de t''accueillir dans <strong>ES Academy</strong>. Tu viens de rejoindre une communauté d''investisseurs qui bossent pour se construire une vie plus libre grâce à l''immo.</p>
  <p>Pour accéder à ta formation, clique sur le bouton ci-dessous pour activer ton compte :</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{activation_url}}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Activer mon compte</a>
  </p>
  <p>Si le bouton ne marche pas, copie-colle ce lien : <br><a href="{{activation_url}}">{{activation_url}}</a></p>
  <p>À tout de suite,<br><strong>Emeline</strong></p>
</div>',
  '["prenom", "email", "activation_url", "product_name"]'::jsonb
),
(
  'reset_password',
  'Réinitialisation du mot de passe',
  'Envoyé quand un élève clique sur "Mot de passe oublié".',
  'Réinitialise ton mot de passe ES Academy',
  '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833;">
  <h1 style="color: #1B4332; font-size: 24px;">Réinitialise ton mot de passe</h1>
  <p>Hello {{prenom}},</p>
  <p>Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous pour en choisir un nouveau :</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{reset_url}}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Choisir un nouveau mot de passe</a>
  </p>
  <p style="font-size: 13px; color: #666;">Ce lien expire dans 1 heure. Si tu n''as pas demandé cette réinitialisation, ignore ce mail.</p>
  <p>À bientôt,<br><strong>Emeline</strong></p>
</div>',
  '["prenom", "email", "reset_url"]'::jsonb
),
(
  'welcome_purchase_academy',
  'Bienvenue après achat Academy',
  'Envoyé automatiquement après un achat réussi de la formation Academy (webhook Stripe).',
  'Ton accès ES Academy est activé 🏠',
  '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833;">
  <h1 style="color: #1B4332; font-size: 26px;">Félicitations {{prenom}} !</h1>
  <p>Tu viens d''acheter <strong>ES Academy</strong> et je ne peux que te dire : <em>bravo</em>. Tu viens de faire un choix qui va transformer ton rapport à l''argent et à l''investissement.</p>
  <p>Voici comment accéder à ta formation :</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accéder à ma formation</a>
  </p>
  <p>📚 14 modules · 64 leçons · accès à vie<br>🎯 Tes {{coaching_credits}} séances de coaching sont disponibles dans ton espace</p>
  <p>On se retrouve de l''autre côté !<br><strong>Emeline</strong></p>
</div>',
  '["prenom", "email", "dashboard_url", "coaching_credits", "amount_paid"]'::jsonb
),
(
  'welcome_purchase_family',
  'Bienvenue après inscription Family',
  'Envoyé après inscription à ES Family (Skool).',
  'Bienvenue dans ES Family 🏡',
  '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833;">
  <h1 style="color: #1B4332; font-size: 26px;">Welcome dans la Family {{prenom}} !</h1>
  <p>Ton inscription à <strong>ES Family</strong> est confirmée. Tu as désormais accès à :</p>
  <ul>
    <li>Les lives hebdomadaires</li>
    <li>La communauté Skool (échange entre membres)</li>
    <li>Les replays illimités</li>
  </ul>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{skool_url}}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Rejoindre la communauté</a>
  </p>
  <p>Tu peux te désinscrire à tout moment depuis ton compte Skool.</p>
  <p>À très vite,<br><strong>Emeline</strong></p>
</div>',
  '["prenom", "email", "skool_url"]'::jsonb
),
(
  'coaching_booked',
  'Confirmation de coaching réservé',
  'Envoyé quand un élève réserve une séance de coaching.',
  'Ton coaching est réservé ✅',
  '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833;">
  <h1 style="color: #1B4332; font-size: 24px;">Hello {{prenom}}, ton coaching est bien réservé !</h1>
  <p><strong>📅 Date :</strong> {{coaching_date}}<br>
  <strong>🕐 Heure :</strong> {{coaching_time}}<br>
  <strong>📍 Lien visio :</strong> <a href="{{meeting_url}}">{{meeting_url}}</a></p>
  <p>Pour que notre session soit la plus utile possible, prépare :</p>
  <ul>
    <li>Ta situation actuelle (revenus, épargne, crédits en cours)</li>
    <li>Tes objectifs à court et long terme</li>
    <li>Tes questions prioritaires</li>
  </ul>
  <p>Il te reste <strong>{{remaining_coachings}}</strong> séance(s) après celle-ci.</p>
  <p>À très vite,<br><strong>Emeline</strong></p>
</div>',
  '["prenom", "email", "coaching_date", "coaching_time", "meeting_url", "remaining_coachings"]'::jsonb
)
ON CONFLICT (key) DO NOTHING;
