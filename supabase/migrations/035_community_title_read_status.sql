-- ============================================================
-- Migration 035: Community — title en posts + read status tracking
-- ============================================================

-- 1. Add title column to community_posts
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. Community Read Status (tracks last visit per user per community)
CREATE TABLE IF NOT EXISTS community_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_read_status_user ON community_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_community_read_status_community ON community_read_status(community_id, user_id);

-- RLS
ALTER TABLE community_read_status ENABLE ROW LEVEL SECURITY;

-- Trainer: full access on read status in own community
CREATE POLICY "trainer_read_status_all" ON community_read_status
  FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_read_status.community_id
        AND c.coach_id = auth.uid()
    )
  )
  WITH CHECK (auth.uid() = user_id);

-- Client: manage own read status
CREATE POLICY "client_read_status_own" ON community_read_status
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Realtime (for badge updates)
ALTER PUBLICATION supabase_realtime ADD TABLE community_read_status;
