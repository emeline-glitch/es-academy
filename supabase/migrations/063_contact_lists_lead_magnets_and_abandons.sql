-- 063_contact_lists_lead_magnets_and_abandons : cree 2 dossiers + 8 listes
-- pour segmenter automatiquement les contacts.
--
-- Modele : une liste est juste un tag_key. Tout contact ayant ce tag dans
-- son array tags apparait dans la liste. Pas de jointure manuelle a
-- maintenir, c'est l'admin /lists qui filtre par contacts.tags @> [tag_key].
--
-- Lead magnets : tags lm:slug deja appliques par les forms d'opt-in.
-- Paniers abandonnes : tags cart-abandoned:product appliques par le cron
-- abandon-reminders au moment du J+1, et retires par le webhook Stripe
-- a la completion (cf migration 062 + modif route).

-- 1. Dossiers
INSERT INTO public.contact_list_folders (id, name, sort_order)
VALUES
  (gen_random_uuid(), 'Lead magnets', 10),
  (gen_random_uuid(), 'Paniers abandonnés', 20)
ON CONFLICT DO NOTHING;

-- 2. Listes lead magnets (6 LM connus)
INSERT INTO public.contact_lists (id, folder_id, name, tag_key, description, color, sort_order)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.contact_list_folders WHERE name = 'Lead magnets' LIMIT 1),
  d.name,
  d.tag_key,
  d.description,
  d.color,
  d.sort_order
FROM (VALUES
  ('Masterclass fondatrice', 'lm:masterclass-fondatrice', 'Opt-ins masterclass evergreen 45-60min sur Bunny', '#C4724A', 10),
  ('Quiz investissement locatif', 'lm:quiz-investissement-locatif', 'Opt-ins quiz "Es-tu fait pour l''investissement locatif"', '#4A7AC4', 20),
  ('Simulateur rentabilité', 'lm:simulateur-rentabilite', 'Opt-ins simulateur de rentabilite locative', '#1B4332', 30),
  ('Cahier de vacances', 'lm:cahier-vacances', 'Opt-ins cahier de vacances investisseur (juillet-aout)', '#D4A017', 40),
  ('Calendrier de l''Avent', 'lm:calendrier-avent', 'Opt-ins calendrier de l''Avent (decembre)', '#A23B5A', 50),
  ('Chasse aux oeufs', 'lm:chasse-oeufs', 'Opt-ins chasse aux oeufs (Paques)', '#6B8E23', 60)
) AS d(name, tag_key, description, color, sort_order)
ON CONFLICT (tag_key) DO NOTHING;

-- 3. Listes paniers abandonnes (Academy + Family)
INSERT INTO public.contact_lists (id, folder_id, name, tag_key, description, color, sort_order)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.contact_list_folders WHERE name = 'Paniers abandonnés' LIMIT 1),
  d.name,
  d.tag_key,
  d.description,
  d.color,
  d.sort_order
FROM (VALUES
  ('Panier Academy abandonné', 'cart-abandoned:academy', 'Contacts ayant lance un checkout Academy sans finaliser (24h+ sans paiement). Tag pose par le cron J+1, retire par le webhook Stripe a la completion.', '#C44A4A', 10),
  ('Panier Family abandonné', 'cart-abandoned:family', 'Contacts ayant lance un checkout Family sans finaliser (24h+ sans paiement). Idem retire a la completion.', '#E67E22', 20)
) AS d(name, tag_key, description, color, sort_order)
ON CONFLICT (tag_key) DO NOTHING;
