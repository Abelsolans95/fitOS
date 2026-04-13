-- ============================================================
-- Migration 047: Public Profiles, Blog, CRM Leads
-- Adds: slug + accent_color to profiles,
--        is_public + slug + meta_description to community_posts,
--        leads table for CRM pipeline
-- ============================================================

-- ── Profiles: public slug & accent color ──────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#00E5FF';

-- ── Community posts: public blog fields ───────────────────────

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- ── Leads table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  goal TEXT,
  source TEXT NOT NULL DEFAULT 'landing'
    CHECK (source IN ('landing','blog','instagram_dm','instagram_ads','tiktok','whatsapp','manual')),
  status TEXT NOT NULL DEFAULT 'nuevo'
    CHECK (status IN ('nuevo','contactado','interesado','prueba','cliente','descartado')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Trigger: auto-update updated_at on leads ──────────────────

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ── Function: auto-generate slug from full_name ───────────────

CREATE OR REPLACE FUNCTION generate_profile_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Only generate if slug is null and full_name is set
  IF NEW.slug IS NULL AND NEW.full_name IS NOT NULL AND NEW.role = 'trainer' THEN
    -- Convert to lowercase, replace spaces/special chars with hyphens
    base_slug := lower(regexp_replace(
      regexp_replace(
        unaccent(NEW.full_name),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ));
    -- Trim trailing hyphens
    base_slug := trim(BOTH '-' FROM base_slug);

    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'trainer';
    END IF;

    final_slug := base_slug;

    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug AND user_id != NEW.user_id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := final_slug;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_profile_slug_trigger
  BEFORE INSERT OR UPDATE OF full_name ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_profile_slug();

-- ── RLS: leads scoped to trainer ──────────────────────────────

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Trainer can SELECT their own leads
CREATE POLICY leads_trainer_select ON leads
  FOR SELECT TO authenticated
  USING (trainer_id = auth.uid());

-- Trainer can INSERT their own leads (manual add)
CREATE POLICY leads_trainer_insert ON leads
  FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid());

-- Trainer can UPDATE their own leads
CREATE POLICY leads_trainer_update ON leads
  FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Trainer can DELETE their own leads
CREATE POLICY leads_trainer_delete ON leads
  FOR DELETE TO authenticated
  USING (trainer_id = auth.uid());

-- ── RLS: public community_posts readable by anon ──────────────

CREATE POLICY community_posts_public_select ON community_posts
  FOR SELECT TO anon
  USING (is_public = true);

-- ── RLS: public trainer profiles readable by anon ─────────────

CREATE POLICY profiles_public_trainer_select ON profiles
  FOR SELECT TO anon
  USING (role = 'trainer' AND slug IS NOT NULL);

-- ── Index for fast slug lookups ───────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_posts_public ON community_posts(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_leads_trainer_id ON leads(trainer_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
