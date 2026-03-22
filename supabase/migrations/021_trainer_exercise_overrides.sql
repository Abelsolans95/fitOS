-- Layer C: Trainer overrides/personalizations of global exercises
-- A trainer can customize name, description, notes for any global exercise
-- without modifying the global record itself.

CREATE TABLE trainer_exercise_overrides (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id       UUID NOT NULL REFERENCES trainer_exercise_library(id) ON DELETE CASCADE,
  custom_name       TEXT,
  custom_description TEXT,
  custom_notes      TEXT,
  custom_video_url  TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (trainer_id, exercise_id)
);

-- Indexes
CREATE INDEX idx_exercise_overrides_trainer ON trainer_exercise_overrides(trainer_id);
CREATE INDEX idx_exercise_overrides_exercise ON trainer_exercise_overrides(exercise_id);

-- RLS
ALTER TABLE trainer_exercise_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers manage own exercise overrides"
  ON trainer_exercise_overrides
  FOR ALL
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Generic updated_at function (idempotent, reused by other migrations)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger
CREATE TRIGGER set_updated_at_exercise_overrides
  BEFORE UPDATE ON trainer_exercise_overrides
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
