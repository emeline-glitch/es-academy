-- Table app_config : key/value paires pour sortir le hardcoding des labels
-- métier (montants, wording paiement, prix Family, etc.) du code et les rendre
-- éditables par l'admin sans déploiement.
--
-- Cohérent avec la règle ZERO hardcoding : tout contenu visible client doit
-- être en DB. Pour Phase 1, l'admin édite via SQL ou /admin/config (à créer).

CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS app_config_updated_at ON public.app_config;
CREATE TRIGGER app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT ON public.app_config TO authenticated, service_role;

-- Seed initial des labels Academy/Family. ON CONFLICT DO NOTHING pour ne pas
-- écraser les overrides admin sur ré-application de la migration.
INSERT INTO public.app_config (key, value, description) VALUES
  (
    'payment_label_one_shot',
    '998€ en une fois',
    'Wording affiché dans les mails Academy quand l''achat est en 1x. Utilisé par welcome-academy.ts.'
  ),
  (
    'payment_label_multi_template',
    '{installments}x paiement mensuel',
    'Template avec placeholder {installments} pour les achats Academy 3x/4x. Le code remplace {installments} par 3 ou 4. Utilisé par welcome-academy.ts.'
  ),
  (
    'academy_total_amount_eur',
    '998',
    'Montant total Academy en euros (pour les copies wording divers).'
  ),
  (
    'family_monthly_price_standard_eur',
    '29',
    'Prix mensuel ES Family standard.'
  ),
  (
    'family_monthly_price_alumni_eur',
    '19',
    'Prix mensuel ES Family pour alumni Evermind (a vie).'
  ),
  (
    'family_alumni_offer_deadline',
    '2026-07-31',
    'Date limite tarif alumni 19€/mois. Apres : 29€ standard.'
  ),
  (
    'family_trial_months_academy',
    '3',
    'Nombre de mois ES Family offerts aux eleves Academy (loi Chatel).'
  ),
  (
    'family_trial_months_alumni',
    '12',
    'Nombre de mois ES Family offerts aux alumni Evermind.'
  )
ON CONFLICT (key) DO NOTHING;
