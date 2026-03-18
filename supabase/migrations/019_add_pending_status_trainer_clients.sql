-- Add 'pending' to trainer_clients status CHECK constraint
-- Needed for clients who registered but haven't confirmed their email yet

ALTER TABLE trainer_clients
  DROP CONSTRAINT IF EXISTS trainer_clients_status_check;

ALTER TABLE trainer_clients
  ADD CONSTRAINT trainer_clients_status_check
  CHECK (status IN ('active', 'paused', 'cancelled', 'pending'));
