-- Add hidden flag to trainer_exercise_overrides
-- When a trainer "deletes" a global exercise, it's only hidden for them.
-- Other trainers still see the original global exercise.

ALTER TABLE trainer_exercise_overrides
  ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;
