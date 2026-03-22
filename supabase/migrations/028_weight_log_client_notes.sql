-- Add client_notes to weight_log for client feedback per exercise
ALTER TABLE weight_log ADD COLUMN IF NOT EXISTS client_notes TEXT;
