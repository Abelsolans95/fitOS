-- ── Migration 048: Leagues & Gamification ─────────────────────────────────────
-- Trainer toggle on communities + leagues/badges/participants tables.

-- 1. Trainer toggle on communities
ALTER TABLE communities ADD COLUMN IF NOT EXISTS gamification_enabled BOOLEAN NOT NULL DEFAULT false;

-- 2. Leagues table
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  metric TEXT NOT NULL CHECK (metric IN ('consistency','volume','steps','sessions','custom')),
  custom_metric_name TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  prize TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','active','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. League participants
CREATE TABLE league_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id),
  score NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(league_id, client_id)
);

-- 4. Badges table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  condition TEXT NOT NULL
);

-- 5. User badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  badge_id UUID NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- 6. Seed default badges
INSERT INTO badges (name, description, icon, condition) VALUES
  ('Racha 7 dias', 'Entrena 7 dias seguidos', 'flame', 'streak_7'),
  ('Racha 30 dias', 'Entrena 30 dias seguidos', 'fire', 'streak_30'),
  ('Primera liga', 'Participa en tu primera liga', 'trophy', 'first_league'),
  ('Top 3', 'Termina en el podio de una liga', 'medal', 'top_3'),
  ('Campeon', 'Gana una liga', 'crown', 'champion'),
  ('Constancia', '50 sesiones completadas', 'check', 'sessions_50'),
  ('Centurion', '100 sesiones completadas', 'shield', 'sessions_100'),
  ('PR Personal', 'Supera tu mejor marca', 'zap', 'personal_record');

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Leagues: trainer full CRUD on own leagues
CREATE POLICY leagues_trainer_select ON leagues FOR SELECT TO authenticated
  USING (trainer_id = auth.uid());

CREATE POLICY leagues_trainer_insert ON leagues FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY leagues_trainer_update ON leagues FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());

CREATE POLICY leagues_trainer_delete ON leagues FOR DELETE TO authenticated
  USING (trainer_id = auth.uid());

-- Leagues: clients can SELECT leagues they participate in
CREATE POLICY leagues_client_select ON leagues FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM league_participants lp
      WHERE lp.league_id = leagues.id AND lp.client_id = auth.uid()
    )
  );

-- League participants: trainer can manage participants on their leagues
CREATE POLICY lp_trainer_select ON league_participants FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leagues l WHERE l.id = league_participants.league_id AND l.trainer_id = auth.uid()
    )
  );

CREATE POLICY lp_trainer_insert ON league_participants FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leagues l WHERE l.id = league_participants.league_id AND l.trainer_id = auth.uid()
    )
  );

CREATE POLICY lp_trainer_update ON league_participants FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leagues l WHERE l.id = league_participants.league_id AND l.trainer_id = auth.uid()
    )
  );

CREATE POLICY lp_trainer_delete ON league_participants FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leagues l WHERE l.id = league_participants.league_id AND l.trainer_id = auth.uid()
    )
  );

-- League participants: client can see their own participation and SELECT all for leagues they're in
CREATE POLICY lp_client_select ON league_participants FOR SELECT TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM league_participants my
      WHERE my.league_id = league_participants.league_id AND my.client_id = auth.uid()
    )
  );

-- Client can join a league (INSERT own row) — must be linked to the league's trainer
CREATE POLICY lp_client_insert ON league_participants FOR INSERT TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM leagues l
      JOIN trainer_clients tc ON tc.trainer_id = l.trainer_id AND tc.client_id = auth.uid()
      WHERE l.id = league_participants.league_id
    )
  );

-- Badges: all authenticated can read
CREATE POLICY badges_select ON badges FOR SELECT TO authenticated USING (true);

-- User badges: users can see own badges
CREATE POLICY user_badges_select ON user_badges FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- User badges: trainers can grant badges to their clients
CREATE POLICY user_badges_trainer_insert ON user_badges FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid() AND tc.client_id = user_badges.user_id
    )
  );

-- User badges: system/self can see any user's badges in leagues they share
CREATE POLICY user_badges_league_select ON user_badges FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM league_participants lp1
      JOIN league_participants lp2 ON lp1.league_id = lp2.league_id
      WHERE lp1.client_id = auth.uid() AND lp2.client_id = user_badges.user_id
    )
  );
