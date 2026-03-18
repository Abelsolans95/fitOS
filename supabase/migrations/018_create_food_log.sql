-- 018_create_food_log.sql
-- Registro de comidas del cliente (Vision Calorie Tracker + registro manual)
CREATE TABLE food_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  meal_type    TEXT NOT NULL CHECK (meal_type IN ('desayuno','almuerzo','comida','merienda','cena','snack')),
  foods        JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- foods: [{food_id?, name, portion_g, kcal, protein, carbs, fat, fiber?}]
  total_kcal   NUMERIC(7,1) NOT NULL DEFAULT 0,
  total_protein NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_carbs  NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_fat    NUMERIC(6,2) NOT NULL DEFAULT 0,
  photo_url    TEXT DEFAULT NULL,
  source       TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','ai_vision')),
  ai_raw       JSONB DEFAULT NULL,
  notes        TEXT DEFAULT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_food_log_client ON food_log(client_id, logged_at DESC);
CREATE INDEX idx_food_log_date ON food_log(client_id, (logged_at::date));

ALTER TABLE food_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client manages own food log" ON food_log
  FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "Trainer views client food log" ON food_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trainer_clients
    WHERE trainer_id = auth.uid() AND client_id = food_log.client_id
  ));
