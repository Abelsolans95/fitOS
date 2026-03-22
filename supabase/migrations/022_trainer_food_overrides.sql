-- Layer C: Trainer overrides/personalizations of global foods
-- A trainer can customize name, macros, notes for any global food
-- without modifying the global record itself.

CREATE TABLE trainer_food_overrides (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id           UUID NOT NULL REFERENCES trainer_food_library(id) ON DELETE CASCADE,
  custom_name       TEXT,
  custom_kcal       NUMERIC,
  custom_protein    NUMERIC,
  custom_carbs      NUMERIC,
  custom_fat        NUMERIC,
  custom_fiber      NUMERIC,
  custom_notes      TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (trainer_id, food_id)
);

-- Indexes
CREATE INDEX idx_food_overrides_trainer ON trainer_food_overrides(trainer_id);
CREATE INDEX idx_food_overrides_food ON trainer_food_overrides(food_id);

-- RLS
ALTER TABLE trainer_food_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers manage own food overrides"
  ON trainer_food_overrides
  FOR ALL
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER set_updated_at_food_overrides
  BEFORE UPDATE ON trainer_food_overrides
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
