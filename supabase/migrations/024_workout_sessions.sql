-- Workout sessions: groups weight_log entries into a single training session.
-- Supports two modes: "registration" (async logging after training)
-- and "active" (real-time guided training with timers).

CREATE TABLE workout_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id        UUID REFERENCES user_routines(id) ON DELETE SET NULL,
  trainer_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Session metadata
  session_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  day_label         TEXT,             -- e.g. "Lunes - Push", from routine
  week_number       INTEGER,          -- which week in the mesocycle

  -- Mode: registration (async) or active (real-time)
  mode              TEXT NOT NULL DEFAULT 'registration'
                    CHECK (mode IN ('registration', 'active')),

  -- Status tracking
  status            TEXT NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'completed', 'abandoned')),

  -- Timing (mainly for active mode)
  started_at        TIMESTAMPTZ DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  duration_seconds  INTEGER,          -- total session duration

  -- Aggregated stats (computed on completion)
  total_volume_kg   NUMERIC,          -- sum of all sets volume
  total_sets        INTEGER,
  total_exercises   INTEGER,

  -- Optional notes
  notes             TEXT,
  rpe_session       INTEGER CHECK (rpe_session BETWEEN 1 AND 10),

  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workout_sessions_client ON workout_sessions(client_id);
CREATE INDEX idx_workout_sessions_routine ON workout_sessions(routine_id);
CREATE INDEX idx_workout_sessions_date ON workout_sessions(client_id, session_date DESC);
CREATE INDEX idx_workout_sessions_trainer ON workout_sessions(trainer_id);

-- RLS
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own workout sessions"
  ON workout_sessions
  FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Trainers view client workout sessions"
  ON workout_sessions
  FOR SELECT
  USING (trainer_id = auth.uid());

CREATE POLICY "Trainers update client workout sessions"
  ON workout_sessions
  FOR UPDATE
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Add session_id FK to weight_log
ALTER TABLE weight_log
  ADD COLUMN session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL;

CREATE INDEX idx_weight_log_session ON weight_log(session_id);

-- Updated_at trigger
CREATE TRIGGER set_updated_at_workout_sessions
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
