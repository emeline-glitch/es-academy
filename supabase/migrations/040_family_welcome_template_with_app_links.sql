-- Migration 040 : update template welcome_purchase_family avec CTAs app stores
--
-- Le template welcome Family pointait uniquement vers la landing page de la
-- communaute. Manquait :
--  1. Un CTA explicite vers /connexion pour activer le compte
--  2. Les liens de telechargement App Store / Play Store
--
-- URLs app stores en placeholder X (l'app n'est pas encore publiee au 2026-05-04).
-- A re-update via une migration ulterieure quand les URLs seront connues.

UPDATE public.email_templates
SET
  available_variables = '["prenom", "email", "login_url", "app_store_url", "play_store_url"]'::jsonb,
  html_content = '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
  <h1 style="color: #1B4332; font-size: 26px; margin-bottom: 20px;">Bienvenue dans la Family, {{prenom}} !</h1>

  <p>Ton inscription a <strong>ES Family</strong> est confirmee. Voici comment demarrer en 2 minutes.</p>

  <h2 style="color: #1B4332; font-size: 18px; margin-top: 28px;">1. Active ton compte</h2>
  <p>Ton compte a ete cree automatiquement avec cet email. Connecte-toi pour acceder a la communaute, aux lives et aux ressources.</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{login_url}}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Me connecter a Family</a>
  </p>

  <h2 style="color: #1B4332; font-size: 18px; margin-top: 28px;">2. Telecharge l''app (recommande)</h2>
  <p>Notifications pour les lives, acces rapide depuis ton telephone, lecture en mode deconnecte. C''est l''experience la plus fluide pour suivre la Family au quotidien.</p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin: 20px auto;">
    <tr>
      <td style="padding-right: 8px;">
        <a href="{{app_store_url}}" style="background: #000; color: white; padding: 12px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">App Store (iOS)</a>
      </td>
      <td style="padding-left: 8px;">
        <a href="{{play_store_url}}" style="background: #000; color: white; padding: 12px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">Google Play (Android)</a>
      </td>
    </tr>
  </table>

  <h2 style="color: #1B4332; font-size: 18px; margin-top: 28px;">3. Ce qui t''attend ce mois-ci</h2>
  <ul>
    <li>Le live mensuel avec moi et un intervenant expert</li>
    <li>L''ebook patrimonial du mois</li>
    <li>L''annuaire des 1 900+ membres</li>
    <li>Les bons plans negocies aupres de mes partenaires (chasseurs, courtiers, artisans)</li>
  </ul>

  <p style="margin-top: 28px;">Une question ? Reponds simplement a ce mail, je lis tout.</p>

  <p>A tres vite,<br><strong>Emeline</strong></p>

  <p style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Tu recois ce mail parce que tu viens de t''abonner a ES Family. <a href="{{unsubscribe_url}}" style="color: #888;">Je me desabonne</a>.</p>
</div>',
  updated_at = now()
WHERE key = 'welcome_purchase_family';
