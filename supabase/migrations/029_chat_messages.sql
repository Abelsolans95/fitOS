-- Migration 029: Chat messages between trainer and client
-- Implements encrypted (RLS-protected) messaging with Supabase Realtime

CREATE TABLE messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for conversation queries (ordered by time)
CREATE INDEX idx_messages_conversation ON messages (trainer_id, client_id, created_at ASC);

-- Index for unread count queries per user
CREATE INDEX idx_messages_unread_client  ON messages (client_id,  read_at) WHERE read_at IS NULL;
CREATE INDEX idx_messages_unread_trainer ON messages (trainer_id, read_at) WHERE read_at IS NULL;

-- Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Trainer can read all messages in their conversations and insert as sender
CREATE POLICY "trainer_can_read_own_messages" ON messages
  FOR SELECT TO authenticated
  USING (auth.uid() = trainer_id);

CREATE POLICY "trainer_can_insert_own_messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = trainer_id AND auth.uid() = sender_id);

-- Trainer can mark messages as read (update read_at only)
CREATE POLICY "trainer_can_update_read_at" ON messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = trainer_id)
  WITH CHECK (auth.uid() = trainer_id);

-- Client can read all messages in their conversations and insert as sender
CREATE POLICY "client_can_read_own_messages" ON messages
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "client_can_insert_own_messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id AND auth.uid() = sender_id);

-- Client can mark messages as read (update read_at only)
CREATE POLICY "client_can_update_read_at" ON messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Enable Realtime for live chat updates
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
