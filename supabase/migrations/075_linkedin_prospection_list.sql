-- 075_linkedin_prospection_list : nouvelle liste CRM pour les prospects
-- LinkedIn collectes par Waalaxy (ou tout outil de prospection LinkedIn).
--
-- 2 chemins d'entree :
--   1. Webhook /api/webhooks/waalaxy (plan Business Waalaxy)
--   2. Import CSV via /admin/import-contacts (tous plans)
--
-- Le tag_key="source:linkedin-waalaxy" est aussi pose sur le champ
-- contacts.source, donc la liste affiche tous les contacts dont source
-- correspond.

INSERT INTO public.contact_lists (tag_key, name, color)
VALUES ('source:linkedin-waalaxy', 'Prospection LinkedIn', 'blue')
ON CONFLICT (tag_key) DO NOTHING;
