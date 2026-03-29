-- ─────────────────────────────────────────────
-- 032 · Routine Templates
-- ─────────────────────────────────────────────
-- Reusable routine configurations saved by trainers.
-- Stores exercises per day-label (without weight/RIR) so
-- the trainer can quickly scaffold new client routines.

CREATE TABLE IF NOT EXISTS routine_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  training_days TEXT[] NOT NULL DEFAULT '{}',   -- e.g. {'lunes','miercoles','viernes'}
  day_labels    JSONB  NOT NULL DEFAULT '{}',   -- e.g. {"lunes":"PIERNA","miercoles":"TORSO"}
  exercises     JSONB  NOT NULL DEFAULT '[]',   -- same shape as user_routines.exercises minus weight/rir
  total_weeks   INT    NOT NULL DEFAULT 4,
  goal          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger (uses set_updated_at from migration 021)
CREATE TRIGGER routine_templates_updated_at
  BEFORE UPDATE ON routine_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Index for fast lookup by trainer
CREATE INDEX idx_routine_templates_trainer ON routine_templates(trainer_id);

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;

-- Trainer full CRUD on own templates
CREATE POLICY "trainer_full_access"
  ON routine_templates
  FOR ALL
  TO authenticated
  USING  (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());
