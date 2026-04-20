-- La migration 014 tentait d'ajouter email_sequences_status_check avec les valeurs
-- {draft, active, paused, archived} MAIS la table avait DÉJÀ une contrainte du même nom
-- limitée à {active, paused} (créée lors du schema initial). Le DO/EXCEPTION swallow l'erreur
-- → l'ancienne contrainte restrictive est restée en place et bloque les INSERT avec status='draft'.
--
-- Fix : drop l'ancienne + recréer avec la whitelist complète.

ALTER TABLE public.email_sequences DROP CONSTRAINT IF EXISTS email_sequences_status_check;

ALTER TABLE public.email_sequences
  ADD CONSTRAINT email_sequences_status_check
  CHECK (status IS NULL OR status IN ('draft', 'active', 'paused', 'archived'));
