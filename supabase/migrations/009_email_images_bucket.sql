-- Bucket public pour les images de newsletters
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-images',
  'email-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Policy : lecture publique
DROP POLICY IF EXISTS "email-images public read" ON storage.objects;
CREATE POLICY "email-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'email-images');

-- Policy : upload par utilisateurs authentifiés (admin check au niveau API)
DROP POLICY IF EXISTS "email-images auth upload" ON storage.objects;
CREATE POLICY "email-images auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'email-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "email-images auth delete" ON storage.objects;
CREATE POLICY "email-images auth delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'email-images' AND auth.role() = 'authenticated');
