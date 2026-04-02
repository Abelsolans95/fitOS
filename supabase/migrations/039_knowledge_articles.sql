-- ============================================================
-- Migration 039: Knowledge Base / FAQ del Trainer
-- ============================================================

-- 1. Knowledge Articles
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  content TEXT NOT NULL CHECK (char_length(content) > 0),
  category TEXT NOT NULL CHECK (category IN ('nutricion', 'rutina', 'lesion', 'tecnica', 'suplementacion', 'general')),
  image_url TEXT,
  video_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  source_ticket_id UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_trainer ON knowledge_articles(trainer_id, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON knowledge_articles(trainer_id, category) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_search ON knowledge_articles USING gin(to_tsvector('spanish', title || ' ' || content)) WHERE is_published = true;

-- Trigger updated_at (reuses set_updated_at from migration 021)
CREATE TRIGGER set_knowledge_articles_updated_at
  BEFORE UPDATE ON knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Trainer: full CRUD on own articles
CREATE POLICY "trainer_articles_all" ON knowledge_articles
  FOR ALL USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Client: SELECT published articles from their trainer
CREATE POLICY "client_articles_select" ON knowledge_articles
  FOR SELECT USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = knowledge_articles.trainer_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
    )
  );

-- ============================================================
-- Full-text search function (Spanish)
-- ============================================================

CREATE OR REPLACE FUNCTION search_knowledge_articles(
  p_trainer_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS SETOF knowledge_articles
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM knowledge_articles
  WHERE trainer_id = p_trainer_id
    AND is_published = true
    AND (
      to_tsvector('spanish', title || ' ' || content) @@ plainto_tsquery('spanish', p_query)
      OR title ILIKE '%' || p_query || '%'
    )
  ORDER BY
    ts_rank(to_tsvector('spanish', title || ' ' || content), plainto_tsquery('spanish', p_query)) DESC,
    view_count DESC
  LIMIT p_limit;
$$;

-- ============================================================
-- Atomic view count increment (callable by clients via RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION increment_article_view(p_article_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE knowledge_articles
  SET view_count = view_count + 1
  WHERE id = p_article_id AND is_published = true;
$$;

-- ============================================================
-- Storage bucket for article images
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-images',
  'knowledge-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "knowledge_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'knowledge-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "knowledge_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'knowledge-images');

CREATE POLICY "knowledge_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'knowledge-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
