-- Migration 051 : bucket Supabase Storage "avatars"
--
-- Utilisé par /profil > AvatarUpload pour que les élèves uploadent leur
-- photo de profil. Le path suit ${userId}/${timestamp}.${ext} pour isoler
-- les uploads par utilisateur (cf src/components/platform/AvatarUpload.tsx).
--
-- Choix d'architecture :
--  - Public read : l'avatar est affiché dans le header de la plateforme +
--    sur /profil. Futur : visible dans la communauté ES Family. Pas de PII
--    dans l'URL (juste un timestamp), donc public OK.
--  - Insert/update/delete scopés sur le préfixe userId : empêche un user
--    authentifié d'écrire dans le dossier d'un autre (impersonation).
--  - Limite 2 Mo + mime jpeg/png/webp : aligné avec le validation client.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  2 * 1024 * 1024,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 1. Lecture publique : tout le monde peut voir un avatar (CDN sert l'URL).
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
CREATE POLICY "Avatars public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 2. Upload : authentifié + path doit commencer par auth.uid().
--    storage.foldername(name) renvoie un text[] des segments du path,
--    [1] = premier segment = userId attendu.
DROP POLICY IF EXISTS "Avatars insert own user folder" ON storage.objects;
CREATE POLICY "Avatars insert own user folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Update : même règle (futur upsert ou overwrite).
DROP POLICY IF EXISTS "Avatars update own files" ON storage.objects;
CREATE POLICY "Avatars update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Delete : un user peut purger son propre avatar (RGPD article 17,
--    + purge applicative après suppression de compte).
DROP POLICY IF EXISTS "Avatars delete own files" ON storage.objects;
CREATE POLICY "Avatars delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
