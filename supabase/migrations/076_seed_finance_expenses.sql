-- 076_seed_finance_expenses : seed des charges fixes SaaS connues.
--
-- Insere les postes de depenses identifies via .env.local et les services
-- recurrents de l'ecosysteme ES Academy. Les MONTANTS sont des ESTIMATIONS
-- typiques pour ces plans, a AJUSTER par Emeline dans /admin/finance.
--
-- Convention : tag NOTE "A AJUSTER" pour reperer rapidement les lignes a
-- valider dans l'UI.
--
-- Idempotent : ON CONFLICT pas dispo car la table n'a pas de UNIQUE sur
-- label. On utilise WHERE NOT EXISTS pour skip si label deja seed.

DO $$
DECLARE
  v_label TEXT;
  v_cat TEXT;
  v_amount BIGINT;
  v_recurring BOOLEAN;
  v_notes TEXT;
  v_existing_count INT;
BEGIN
  FOR v_label, v_cat, v_amount, v_recurring, v_notes IN
    SELECT * FROM (VALUES
      -- SaaS hebergement / infra
      ('Supabase Pro',          'Infra',         2500::BIGINT,  true,  'A AJUSTER - plan Pro estime 25€/mois. Verifier le vrai montant facture.'),
      ('Vercel Pro',            'Infra',         2000::BIGINT,  true,  'A AJUSTER - plan Pro estime 20€/mois.'),
      ('Bunny.net Stream',      'Infra',         1000::BIGINT,  true,  'A AJUSTER - depend du volume video stream. Estime 10€/mois.'),
      ('Amazon SES',            'Infra',          500::BIGINT,  true,  'A AJUSTER - SES = 0.10$/1000 mails. Estime 5€/mois sur faible volume.'),

      -- Outils marketing / CRM
      ('Notion',                'Productivite',  1000::BIGINT,  true,  'A AJUSTER - plan Plus estime 10€/mois.'),
      ('Calendly Pro',          'Productivite',  1200::BIGINT,  true,  'A AJUSTER - plan Pro estime 12€/mois.'),
      ('Waalaxy Business',      'Prospection',   6000::BIGINT,  true,  'A AJUSTER - Business annuel ~80€/mois prorate. Confirmer.'),
      ('Brevo',                 'Emails',         0::BIGINT,    true,  'A AJUSTER - probable plan Free, ou plan paye selon volume newsletter.'),

      -- Domaines / divers
      ('Domaines emeline-siron.fr / es-academy', 'Infra', 200::BIGINT, true, 'A AJUSTER - cout amorti par mois (~24€/an).'),

      -- Prestataires (one-shot ou recurrent)
      ('Tiffany - Copywriting', 'Prestataires',     0::BIGINT,    true,  'A AJUSTER - quel forfait/heure ? Marquer recurrent si mensuel.'),
      ('Antony - Closing',       'Prestataires',    0::BIGINT,    true,  'A AJUSTER - commission % sur vente ? Forfait ?'),
      ('Fita - Ops',             'Prestataires',    0::BIGINT,    true,  'A AJUSTER - mensuel ou one-shot.')
    ) AS v(label, cat, amount, recurring, notes)
  LOOP
    SELECT COUNT(*) INTO v_existing_count
    FROM public.finance_expenses
    WHERE label = v_label;

    IF v_existing_count = 0 THEN
      INSERT INTO public.finance_expenses (label, category, amount_cents, is_recurring_monthly, notes)
      VALUES (v_label, v_cat, v_amount, v_recurring, v_notes);
    END IF;
  END LOOP;
END $$;
