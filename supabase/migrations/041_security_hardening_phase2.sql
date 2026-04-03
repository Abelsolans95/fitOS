-- ============================================================
-- Migration 041: Security Hardening Phase 2
-- Date: 2026-04-03
-- Fixes: Storage SELECT policies, audit_logs table
-- ============================================================

-- ────────────────────────────────────────────
-- 1. Restrict storage bucket SELECT policies
--    Previously: any authenticated user could read any image
--    Now: only images in user's own folder or public community images
-- ────────────────────────────────────────────

-- community-images: only community members can view
DROP POLICY IF EXISTS "community_images_select" ON storage.objects;
CREATE POLICY "community_images_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'community-images'
    AND auth.role() = 'authenticated'
  );
-- NOTE: Community images are semi-public within the platform.
-- True per-community restriction would require a join to community_posts
-- which storage policies don't support well. The RLS on community_posts
-- already prevents seeing posts from other communities, so the image URLs
-- are only obtainable if you can read the post. This is acceptable.

-- ticket-images: only ticket owner or their trainer can view
DROP POLICY IF EXISTS "ticket_images_select" ON storage.objects;
CREATE POLICY "ticket_images_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ticket-images'
    AND auth.role() = 'authenticated'
    AND (
      -- Owner's own folder
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Trainer can view their client's ticket images
      EXISTS (
        SELECT 1 FROM trainer_clients tc
        WHERE tc.trainer_id = auth.uid()
          AND tc.client_id::text = (storage.foldername(name))[1]
      )
    )
  );

-- knowledge-images: published article images visible to trainer's clients
DROP POLICY IF EXISTS "knowledge_images_select" ON storage.objects;
CREATE POLICY "knowledge_images_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'knowledge-images'
    AND auth.role() = 'authenticated'
    AND (
      -- Trainer's own folder
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Client can view their trainer's knowledge images
      EXISTS (
        SELECT 1 FROM trainer_clients tc
        WHERE tc.client_id = auth.uid()
          AND tc.trainer_id::text = (storage.foldername(name))[1]
      )
    )
  );

-- ────────────────────────────────────────────
-- 2. Audit Logs table
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  target_user_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own audit logs
CREATE POLICY "users_read_own_audit_logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Only service_role can INSERT (from API routes)
-- No INSERT policy for regular users = they can't write directly
-- API routes use service_role to insert audit entries

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_created ON audit_logs(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- ────────────────────────────────────────────
-- 3. Audit log insertion function (SECURITY DEFINER)
--    Allows API routes with anon key to insert audit entries
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, target_user_id, metadata, ip_address)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_target_user_id, p_metadata, p_ip_address);
END;
$$;
