-- Migration 039 : update template welcome_purchase_family (retrait Skool)
--
-- Le template DB pointait encore vers Skool comme communaute Family.
-- Skool a ete abandonne en avril 2026 au profit de l'app Family native
-- (Next.js + Capacitor sur ~/es-family, port 3002 en dev, future Vercel
-- en prod).
--
-- On retire toute mention Skool, on remplace skool_url par community_url
-- (qui pointera vers /family ou family.emeline-siron.fr selon la prod
-- finale). Le from_email est deja correct (emeline@emeline-siron.fr,
-- mis a jour par migration manuelle precedente).

UPDATE public.email_templates
SET
  available_variables = '["prenom", "email", "community_url"]'::jsonb,
  html_content = '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
  <h1 style="color: #1B4332; font-size: 26px;">Bienvenue dans la Family, {{prenom}} !</h1>
  <p>Ton inscription a <strong>ES Family</strong> est confirmee. Tu as desormais acces a :</p>
  <ul>
    <li>La communaute privee (annuaire des membres, discussions thematiques)</li>
    <li>Les lives mensuels avec moi et des intervenants experts</li>
    <li>Les replays illimites de tous les lives passes</li>
    <li>Les bons plans negocies aupres de mes partenaires (chasseurs, courtiers, artisans)</li>
  </ul>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{community_url}}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold;">Acceder a la Family</a>
  </p>
  <p>Tu peux gerer ton abonnement (resiliation sans frais a tout moment) depuis ton espace personnel.</p>
  <p>A tres vite,<br><strong>Emeline</strong></p>
  <p style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Tu recois ce mail parce que tu viens de t''abonner a ES Family. <a href="{{unsubscribe_url}}" style="color: #888;">Je me desabonne</a>.</p>
</div>',
  updated_at = now()
WHERE key = 'welcome_purchase_family';
