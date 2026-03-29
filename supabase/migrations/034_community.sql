-- ============================================================
-- Migration 034: Community System (Feed Premium por Trainer)
-- ============================================================

-- 1. Communities (1:1 con trainer)
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mi Comunidad',
  description TEXT,
  mode TEXT NOT NULL DEFAULT 'OPEN' CHECK (mode IN ('OPEN', 'READ_ONLY_CLIENTS')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coach_id)
);

-- 2. Community Posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Community Comments (with reply threading via parent_id)
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Community Likes (posts)
CREATE TABLE IF NOT EXISTS community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 5. Community Comment Likes (with role tracking to differentiate coach likes)
CREATE TABLE IF NOT EXISTS community_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_coach BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent ON community_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_post ON community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comment_likes_comment ON community_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_communities_coach ON communities(coach_id);

-- Triggers updated_at
CREATE TRIGGER set_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;

-- ── communities ──

-- Trainer: full CRUD on own community
CREATE POLICY "trainer_community_all" ON communities
  FOR ALL USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Client: SELECT community of their trainer
CREATE POLICY "client_community_select" ON communities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = communities.coach_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
    )
  );

-- ── community_posts ──

-- Trainer: full CRUD on posts in own community
CREATE POLICY "trainer_posts_all" ON community_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_posts.community_id
        AND c.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_posts.community_id
        AND c.coach_id = auth.uid()
    )
  );

-- Client: SELECT posts from their trainer's community (if active)
CREATE POLICY "client_posts_select" ON community_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM communities c
      JOIN trainer_clients tc ON tc.trainer_id = c.coach_id
      WHERE c.id = community_posts.community_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
        AND c.is_active = true
    )
  );

-- Client: INSERT posts ONLY when mode = 'OPEN'
CREATE POLICY "client_posts_insert" ON community_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM communities c
      JOIN trainer_clients tc ON tc.trainer_id = c.coach_id
      WHERE c.id = community_posts.community_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
        AND c.is_active = true
        AND c.mode = 'OPEN'
    )
  );

-- Client: UPDATE/DELETE own posts only
CREATE POLICY "client_posts_update_own" ON community_posts
  FOR UPDATE USING (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM communities c
      JOIN trainer_clients tc ON tc.trainer_id = c.coach_id
      WHERE c.id = community_posts.community_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
    )
  )
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "client_posts_delete_own" ON community_posts
  FOR DELETE USING (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM communities c
      JOIN trainer_clients tc ON tc.trainer_id = c.coach_id
      WHERE c.id = community_posts.community_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
    )
  );

-- ── community_comments ──

-- Trainer: full CRUD on comments in own community
CREATE POLICY "trainer_comments_all" ON community_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_posts p
      JOIN communities c ON c.id = p.community_id
      WHERE p.id = community_comments.post_id
        AND c.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_posts p
      JOIN communities c ON c.id = p.community_id
      WHERE p.id = community_comments.post_id
        AND c.coach_id = auth.uid()
    )
  );

-- Client: SELECT comments from their trainer's posts
CREATE POLICY "client_comments_select" ON community_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_posts p
      JOIN communities c ON c.id = p.community_id
      JOIN trainer_clients tc ON tc.trainer_id = c.coach_id
      WHERE p.id = community_comments.post_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
        AND c.is_active = true
    )
  );

-- Client: INSERT comments (both modes allow comments)
CREATE POLICY "client_comments_insert" ON community_comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM community_posts p
      JOIN communities c ON c.id = p.community_id
      JOIN trainer_clients tc ON tc.trainer_id = c.coach_id
      WHERE p.id = community_comments.post_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
        AND c.is_active = true
    )
  );

-- Client: DELETE own comments
CREATE POLICY "client_comments_delete_own" ON community_comments
  FOR DELETE USING (
    auth.uid() = author_id
  );

-- ── community_likes ──

-- Trainer: full access on likes in own community
CREATE POLICY "trainer_likes_all" ON community_likes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_posts p
      JOIN communities c ON c.id = p.community_id
      WHERE p.id = community_likes.post_id
        AND c.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_posts p
      JOIN communities c ON c.id = p.community_id
      WHERE p.id = community_likes.post_id
        AND c.coach_id = auth.uid()
    )
  );

-- Client: SELECT likes from their trainer's posts
CREATE POLICY "client_likes_select" ON community_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_posts p
      JOIN communities c ON c.id = p.community_id
      JOIN trainer_clients tc ON tc.trainer_id = c.coach_id
      WHERE p.id = community_likes.post_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
        AND c.is_active = true
    )
  );

-- Client: INSERT/DELETE own likes
CREATE POLICY "client_likes_insert" ON community_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM community_posts p
      JOIN communities c ON c.id = p.community_id
      JOIN trainer_clients tc ON tc.trainer_id = c.coach_id
      WHERE p.id = community_likes.post_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
        AND c.is_active = true
    )
  );

CREATE POLICY "client_likes_delete_own" ON community_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ── community_comment_likes ──

-- Trainer: full access on comment likes in own community
CREATE POLICY "trainer_comment_likes_all" ON community_comment_likes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_comments cc
      JOIN community_posts p ON p.id = cc.post_id
      JOIN communities c ON c.id = p.community_id
      WHERE cc.id = community_comment_likes.comment_id
        AND c.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_comments cc
      JOIN community_posts p ON p.id = cc.post_id
      JOIN communities c ON c.id = p.community_id
      WHERE cc.id = community_comment_likes.comment_id
        AND c.coach_id = auth.uid()
    )
  );

-- Client: SELECT comment likes from their trainer's community
CREATE POLICY "client_comment_likes_select" ON community_comment_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_comments cc
      JOIN community_posts p ON p.id = cc.post_id
      JOIN communities c ON c.id = p.community_id
      JOIN trainer_clients tc ON tc.trainer_id = c.coach_id
      WHERE cc.id = community_comment_likes.comment_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
        AND c.is_active = true
    )
  );

-- Client: INSERT/DELETE own comment likes
CREATE POLICY "client_comment_likes_insert" ON community_comment_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM community_comments cc
      JOIN community_posts p ON p.id = cc.post_id
      JOIN communities c ON c.id = p.community_id
      JOIN trainer_clients tc ON tc.trainer_id = c.coach_id
      WHERE cc.id = community_comment_likes.comment_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
        AND c.is_active = true
    )
  );

CREATE POLICY "client_comment_likes_delete_own" ON community_comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ── Realtime ──
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE community_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE community_comment_likes;

-- ── Storage bucket for community images ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-images',
  'community-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: trainer + clients can upload to their community folder
CREATE POLICY "community_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'community-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "community_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-images');

CREATE POLICY "community_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'community-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
