-- ============================================================
-- Migration 038: Support Tickets (Consultas Cliente → Trainer)
-- ============================================================

-- 1. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('nutricion', 'rutina', 'lesion', 'general')),
  subject TEXT NOT NULL CHECK (char_length(subject) > 0 AND char_length(subject) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) > 0),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  trainer_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Ticket Replies
CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0),
  image_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_trainer ON support_tickets(trainer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_client ON support_tickets(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON ticket_replies(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_unread ON ticket_replies(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_support_tickets_unread ON support_tickets(trainer_id) WHERE trainer_read_at IS NULL;

-- Trigger updated_at (reuses set_updated_at from migration 021)
CREATE TRIGGER set_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

-- ── support_tickets ──

-- Trainer: full access to tickets where they are the trainer
CREATE POLICY "trainer_tickets_all" ON support_tickets
  FOR ALL USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Client: SELECT own tickets
CREATE POLICY "client_tickets_select" ON support_tickets
  FOR SELECT USING (client_id = auth.uid());

-- Client: INSERT own tickets
CREATE POLICY "client_tickets_insert" ON support_tickets
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- ── ticket_replies ──

-- Trainer: full access to replies on their tickets
CREATE POLICY "trainer_replies_all" ON ticket_replies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_replies.ticket_id
        AND t.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_replies.ticket_id
        AND t.trainer_id = auth.uid()
    )
  );

-- Trainer: UPDATE read_at on any reply in their tickets (needed because
-- trainer_replies_all WITH CHECK requires sender_id=auth.uid(), which fails
-- when trainer marks a CLIENT's reply as read)
CREATE POLICY "trainer_replies_update_read" ON ticket_replies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_replies.ticket_id
        AND t.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_replies.ticket_id
        AND t.trainer_id = auth.uid()
    )
  );

-- Client: SELECT replies on their tickets
CREATE POLICY "client_replies_select" ON ticket_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_replies.ticket_id
        AND t.client_id = auth.uid()
    )
  );

-- Client: INSERT replies on their tickets
CREATE POLICY "client_replies_insert" ON ticket_replies
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_replies.ticket_id
        AND t.client_id = auth.uid()
    )
  );

-- Client: UPDATE read_at on replies (to mark trainer replies as read)
CREATE POLICY "client_replies_update_read" ON ticket_replies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_replies.ticket_id
        AND t.client_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_replies.ticket_id
        AND t.client_id = auth.uid()
    )
  );

-- ── Realtime ──
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_replies;

-- ── Storage bucket for ticket images ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-images',
  'ticket-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ticket_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ticket-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "ticket_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'ticket-images');

CREATE POLICY "ticket_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ticket-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
