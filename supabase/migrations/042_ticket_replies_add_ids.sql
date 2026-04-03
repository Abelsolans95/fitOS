-- ============================================================
-- Migration 042: Add trainer_id + client_id to ticket_replies
-- Date: 2026-04-03
-- Purpose: Enable proper Realtime filtering on ticket_replies
--          (previously no direct column to filter by trainer or client)
-- ============================================================

-- 1. Add columns (nullable for backwards compatibility with existing rows)
ALTER TABLE ticket_replies ADD COLUMN IF NOT EXISTS trainer_id UUID;
ALTER TABLE ticket_replies ADD COLUMN IF NOT EXISTS client_id UUID;

-- 2. Backfill from parent support_tickets
UPDATE ticket_replies tr
SET
  trainer_id = st.trainer_id,
  client_id = st.client_id
FROM support_tickets st
WHERE tr.ticket_id = st.id
  AND (tr.trainer_id IS NULL OR tr.client_id IS NULL);

-- 3. Make NOT NULL now that all rows are backfilled
ALTER TABLE ticket_replies ALTER COLUMN trainer_id SET NOT NULL;
ALTER TABLE ticket_replies ALTER COLUMN client_id SET NOT NULL;

-- 4. Index for Realtime filter performance
CREATE INDEX IF NOT EXISTS idx_ticket_replies_trainer ON ticket_replies(trainer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_client ON ticket_replies(client_id);
