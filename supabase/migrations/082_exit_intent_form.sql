-- 082_exit_intent_form : liste + form pour la capture exit-intent.
--
-- Quand un visiteur fait mine de quitter /academy ou /family (souris vers
-- le haut du viewport), on affiche un popup non-intrusif qui capture l'email
-- en echange d'un guide gratuit. Ces leads vont dans la liste "Visiteur
-- sauve - Exit Intent" et sont tagues pour relance specifique.

-- 1. Liste CRM dediee
INSERT INTO public.contact_lists (tag_key, name, color)
VALUES ('lm:exit-intent', 'Visiteur sauvé (exit intent)', 'amber')
ON CONFLICT (tag_key) DO NOTHING;

-- 2. Form "exit-intent" pour reutiliser l'API publique /api/forms/[slug]/submit
INSERT INTO public.forms (slug, name, title, description, tag_on_submit, list_id, status, success_message, redirect_url)
SELECT
  'exit-intent',
  'Exit-intent capture',
  'Avant de partir...',
  'Recois mon guide gratuit pour cadrer ton premier investissement immobilier.',
  'lm:exit-intent',
  (SELECT id FROM public.contact_lists WHERE tag_key = 'lm:exit-intent'),
  'published',
  'Guide envoye ! Verifie ta boite mail dans 2 minutes.',
  NULL
WHERE NOT EXISTS (SELECT 1 FROM public.forms WHERE slug = 'exit-intent');
