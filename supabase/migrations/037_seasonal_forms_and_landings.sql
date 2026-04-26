-- Cree les 3 forms saisonniers (avent, chasse, cahier) + alignement lm.landing_page_url.
--
-- - cahier-vacances : la landing existe deja a /cahier-preview (proto interactif).
--   On align l'URL du lm. Les forms /forms/cahier-vacances doit exister pour
--   que /api/forms/cahier-vacances/submit fonctionne.
-- - calendrier-avent : nouvelle landing /calendrier-avent (creee dans le meme commit)
-- - chasse-oeufs : nouvelle landing /chasse-oeufs (creee dans le meme commit)
--
-- Les forms sont published (les landings appellent /api/forms/<slug>/submit).
-- tag_on_submit = lm:<slug> pour declencher l'auto-enroll vers SEQ_CV / SEQ_CO / SEQ_AVENT.

-- Aligne l'URL du cahier-vacances avec la page existante
UPDATE public.lead_magnets
SET landing_page_url = '/cahier-preview'
WHERE slug = 'cahier-vacances';

-- Cree les 3 forms saisonniers (idempotent)
INSERT INTO public.forms (slug, name, status, tag_on_submit, redirect_url)
VALUES
  ('cahier-vacances', 'Cahier de vacances investisseur', 'published', 'lm:cahier-vacances', '/cahier-preview/merci'),
  ('calendrier-avent', 'Calendrier de l''Avent investisseur', 'published', 'lm:calendrier-avent', '/calendrier-avent/merci'),
  ('chasse-oeufs', 'Chasse aux oeufs immo', 'published', 'lm:chasse-oeufs', '/chasse-oeufs/merci')
ON CONFLICT (slug) DO UPDATE SET
  tag_on_submit = EXCLUDED.tag_on_submit,
  status = EXCLUDED.status,
  redirect_url = EXCLUDED.redirect_url
WHERE public.forms.tag_on_submit IS NULL OR public.forms.status != 'published';
