-- Migration 050 : extension profiles pour espace eleve
--
-- Ajoute les colonnes necessaires a la page /profil :
--  - city : ville renseignee par l'eleve (free text)
--  - bio : courte bio (max 280 chars cote app)
--  - notification_preferences : JSONB { email_weekly_digest, email_lives, email_new_content }
--
-- Pas de colonne streak en DB : le streak (jours consecutifs avec au moins
-- une lecon completee) est calcule a la volee depuis progress.completed_at.
-- C'est moins de 100 rows par eleve, donc le calcul cote app reste rapide
-- et evite tout risque de desync entre DB et "verite" derriere les leçons.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS bio  TEXT,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB
    NOT NULL DEFAULT '{"email_weekly_digest": true, "email_lives": true, "email_new_content": true}'::jsonb;

-- Verification de format cote DB : on impose que les 3 cles soient des booleens.
-- Si un futur dev veut ajouter une cle, il devra etendre le check (sage).
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_notification_preferences_shape;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_notification_preferences_shape
  CHECK (
    jsonb_typeof(notification_preferences) = 'object'
    AND jsonb_typeof(notification_preferences->'email_weekly_digest') = 'boolean'
    AND jsonb_typeof(notification_preferences->'email_lives') = 'boolean'
    AND jsonb_typeof(notification_preferences->'email_new_content') = 'boolean'
  );

-- Bio courte : limite cote DB pour eviter qu'un user copie-colle un livre.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_bio_length;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR length(bio) <= 280);

-- City : meme logique, 80 chars suffisent (la plus longue commune francaise
-- "Saint-Remy-en-Bouzemont-Saint-Genest-et-Isson" fait 45 chars).
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_city_length;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_city_length CHECK (city IS NULL OR length(city) <= 80);

COMMENT ON COLUMN public.profiles.city IS 'Ville renseignee par l''eleve sur /profil';
COMMENT ON COLUMN public.profiles.bio IS 'Bio courte (max 280 chars) visible sur /profil';
COMMENT ON COLUMN public.profiles.notification_preferences IS 'Preferences email JSONB : email_weekly_digest, email_lives, email_new_content';
