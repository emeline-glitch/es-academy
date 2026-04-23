-- Index plain sur profiles.email pour les lookups par .eq("email", value).
-- La migration 005 a créé un index fonctionnel `idx_profiles_email_lower`
-- sur LOWER(email) — mais il n'est utilisé QUE par les requêtes type
-- WHERE LOWER(email) = X, pas par WHERE email = X. Comme GoTrue Supabase
-- normalise les emails en lowercase avant stockage, un .eq() est sûr mais
-- faisait un seq scan sans cet index.
--
-- Les emails sont déjà uniques grâce à l'index LOWER(email) de 005, donc
-- on n'a pas besoin d'ajouter UNIQUE ici (eviter un conflit sur un doublon
-- théorique où 2 rows auraient LOWER(email) identique mais case différent).

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
