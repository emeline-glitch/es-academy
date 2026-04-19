-- Perf : lookup profil par email (évite auth.admin.listUsers) + audit log + rate limits

-- 1. Ajouter email sur profiles (synchro depuis auth.users)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower
  ON public.profiles (LOWER(email));

-- Backfill les profils existants depuis auth.users
UPDATE public.profiles p
  SET email = au.email
  FROM auth.users au
  WHERE p.id = au.id
    AND p.email IS NULL;

-- Trigger : quand un nouvel utilisateur auth est créé, copier son email dans profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger : quand l'email est modifié dans auth.users, synchroniser
CREATE OR REPLACE FUNCTION public.sync_email_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_email_to_profile();

-- 2. Rate limits : table simple pour limiter les POST publics
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON public.rate_limits(key, endpoint, created_at);

-- Cleanup auto (garde 24h d'historique)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE created_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Audit log : historique des changements de stage pipeline + coaching credits
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin read audit log" ON public.audit_log;
CREATE POLICY "Admin read audit log" ON public.audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON public.audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor
  ON public.audit_log(actor_id, created_at DESC);

-- 4. Vue optimisée : counts par tag_key (évite de charger tous les contacts côté app)
CREATE OR REPLACE VIEW public.contact_lists_with_count AS
  SELECT
    cl.*,
    COALESCE(counts.cnt, 0) AS contact_count
  FROM public.contact_lists cl
  LEFT JOIN (
    SELECT tag, COUNT(*)::INTEGER AS cnt
    FROM (
      SELECT unnest(tags) AS tag FROM public.contacts WHERE status = 'active'
    ) t
    GROUP BY tag
  ) counts ON counts.tag = cl.tag_key;

GRANT SELECT ON public.contact_lists_with_count TO authenticated;
GRANT SELECT ON public.contact_lists_with_count TO service_role;
