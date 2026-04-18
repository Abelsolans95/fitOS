-- 050_daily_checkins.sql
-- Daily wellness check-in captured by the client from the "Mi día" screen.
-- Unifies subjective state (sleep, stress, energy, pain) so the trainer's
-- "Hoy" panel can flag clients who haven't checked in in 48h.

CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_quality SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
  stress_level SMALLINT CHECK (stress_level BETWEEN 1 AND 5),
  energy_level SMALLINT CHECK (energy_level BETWEEN 1 AND 5),
  pain_level SMALLINT CHECK (pain_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS daily_checkins_client_date_idx
  ON daily_checkins (client_id, checkin_date DESC);

-- Trigger to keep updated_at fresh (custom helper, not moddatetime — gotcha #21)
CREATE OR REPLACE FUNCTION set_daily_checkin_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS daily_checkins_set_updated_at ON daily_checkins;
CREATE TRIGGER daily_checkins_set_updated_at
  BEFORE UPDATE ON daily_checkins
  FOR EACH ROW EXECUTE FUNCTION set_daily_checkin_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- Client: full CRUD on their own rows.
CREATE POLICY daily_checkins_client_all ON daily_checkins
  FOR ALL TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Trainer: SELECT only, and only for clients they actually train (gotcha #112-115).
-- No UPDATE/DELETE from trainer — the data is client-authored.
CREATE POLICY daily_checkins_trainer_select ON daily_checkins
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = daily_checkins.client_id
        AND tc.status = 'active'
    )
  );

COMMENT ON TABLE daily_checkins IS
  'Daily wellness check-in (sleep/stress/energy/pain 1-5). Captured from the client "Mi día" screen and consumed by the trainer "Hoy" panel to surface clients needing attention.';
