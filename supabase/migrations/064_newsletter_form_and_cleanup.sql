-- 064_newsletter_form_and_cleanup
-- 1) Cleanup dossier "Cahier de vacances" vide (doublon avec liste eponyme
--    deja dans dossier "Lead magnets" via migration 063).
-- 2) Cree liste "Newsletter" dans dossier "Newsletter" existant + form public
--    /form/newsletter pour qu'Emeline puisse partager le lien en story Insta.
--    Submit -> contact tagge "newsletter" -> apparait auto dans la liste CRM.
-- 3) Aligne 2 forms existants dont tag_on_submit ne matchait pas le slug de
--    la table lead_magnets : masterclass et quiz-investisseur.

-- ---------------------------------------------------------------------------
-- 1. Cleanup dossier "Cahier de vacances" (vide, fait doublon avec ma liste)
-- ---------------------------------------------------------------------------
DELETE FROM public.contact_list_folders
WHERE name = 'Cahier de vacances'
  AND NOT EXISTS (
    SELECT 1 FROM public.contact_lists
    WHERE folder_id = public.contact_list_folders.id
  );

-- ---------------------------------------------------------------------------
-- 2. Liste Newsletter dans le dossier "Newsletter" existant
-- ---------------------------------------------------------------------------
INSERT INTO public.contact_lists (id, folder_id, name, tag_key, description, color, sort_order)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.contact_list_folders WHERE name = 'Newsletter' LIMIT 1),
  'Newsletter',
  'newsletter',
  'Abonnes a la newsletter bi-hebdo. Tag pose par le form public /form/newsletter (partageable en story Insta) ou par tout autre opt-in qui ajoute le tag.',
  '#1B4332',
  10
ON CONFLICT (tag_key) DO NOTHING;

-- Form public /form/newsletter
INSERT INTO public.forms (
  id, slug, name, title, description, fields, status,
  tag_on_submit, list_id, redirect_url, success_message,
  require_phone, require_last_name, submit_count
)
SELECT
  gen_random_uuid(),
  'newsletter',
  'Newsletter Emeline Siron',
  'Rejoins la newsletter',
  'Un mail tous les 15 jours avec mes coups de coeur immo, mes erreurs evitees, et ce que je vois passer dans le marche. Sans bullshit.',
  '[]'::jsonb,
  'published',
  'newsletter',
  (SELECT id FROM public.contact_lists WHERE tag_key = 'newsletter' LIMIT 1),
  '/form/newsletter/merci',
  'Inscription confirmee. Le prochain mail arrive sous 15 jours, ouvre l''oeil.',
  false,
  false,
  0
WHERE NOT EXISTS (
  SELECT 1 FROM public.forms WHERE slug = 'newsletter'
);

-- ---------------------------------------------------------------------------
-- 3. Aligne les 2 forms desalignes avec les slugs lead_magnets
-- ---------------------------------------------------------------------------
UPDATE public.forms
SET tag_on_submit = 'lm:masterclass-fondatrice'
WHERE slug = 'masterclass' AND tag_on_submit = 'lm:masterclass';

UPDATE public.forms
SET tag_on_submit = 'lm:quiz-investissement-locatif'
WHERE slug = 'quiz-investisseur' AND tag_on_submit = 'lm:quiz-investissement';

-- Lie aussi list_id pour les 6 forms LM existants (pour qu'on voit dans
-- /admin/forms a quelle liste un form est attache, et que les soumissions
-- apparaissent visuellement dans /admin/lists/{liste})
UPDATE public.forms f
SET list_id = l.id
FROM public.contact_lists l
WHERE l.tag_key = f.tag_on_submit
  AND f.list_id IS NULL
  AND f.tag_on_submit LIKE 'lm:%';
