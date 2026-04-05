-- ============================================================
-- Migration 040: Security Hardening
-- Date: 2026-04-03
-- Fixes: VULN-01 to VULN-16 from security audit
-- ============================================================

-- ────────────────────────────────────────────
-- 1. FIX VULN-01: appointments — add trainer_clients validation
-- ────────────────────────────────────────────

DROP POLICY IF EXISTS "Trainer manages own appointments" ON appointments;

CREATE POLICY "Trainer manages own client appointments" ON appointments
  FOR ALL
  USING (
    auth.uid() = trainer_id
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = appointments.client_id
    )
  )
  WITH CHECK (
    auth.uid() = trainer_id
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = appointments.client_id
    )
  );

-- ────────────────────────────────────────────
-- 2. FIX VULN-02: health_logs — add trainer_clients validation
-- ────────────────────────────────────────────

DROP POLICY IF EXISTS "trainer_full_access" ON health_logs;

CREATE POLICY "trainer_full_access" ON health_logs
  FOR ALL
  USING (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = health_logs.client_id
    )
  )
  WITH CHECK (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = health_logs.client_id
    )
  );

-- ────────────────────────────────────────────
-- 3. FIX VULN-03: workout_sessions — add trainer_clients validation
-- ────────────────────────────────────────────

DROP POLICY IF EXISTS "Trainers view client workout sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Trainers update client workout sessions" ON workout_sessions;

CREATE POLICY "Trainers view own client workout sessions" ON workout_sessions
  FOR SELECT
  USING (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = workout_sessions.client_id
    )
  );

CREATE POLICY "Trainers update own client workout sessions" ON workout_sessions
  FOR UPDATE
  USING (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = workout_sessions.client_id
    )
  )
  WITH CHECK (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = workout_sessions.client_id
    )
  );

-- ────────────────────────────────────────────
-- 4. FIX VULN-10: weight_log — add CHECK constraints for metrics
-- ────────────────────────────────────────────

-- Stress index: reasonable max is ~50000 (500kg × 20reps × 5 sets at failure)
ALTER TABLE weight_log
  ADD CONSTRAINT weight_log_stress_index_bounds
  CHECK (stress_index IS NULL OR (stress_index >= 0 AND stress_index <= 50000));

-- Ensure stimulus_rating and fatigue_rating constraints exist
-- (migration 037 should have these, but enforce defensively)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weight_log_stimulus_rating_check'
  ) THEN
    ALTER TABLE weight_log
      ADD CONSTRAINT weight_log_stimulus_rating_check
      CHECK (stimulus_rating IS NULL OR (stimulus_rating >= 1 AND stimulus_rating <= 5));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weight_log_fatigue_rating_check'
  ) THEN
    ALTER TABLE weight_log
      ADD CONSTRAINT weight_log_fatigue_rating_check
      CHECK (fatigue_rating IS NULL OR (fatigue_rating >= 1 AND fatigue_rating <= 5));
  END IF;
END
$$;

-- ────────────────────────────────────────────
-- 5. FIX VULN-09: Prevent role escalation via user_metadata
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  -- If role was set and someone tries to change it, revert
  IF OLD.raw_user_meta_data->>'role' IS NOT NULL
     AND OLD.raw_user_meta_data->>'role' IS DISTINCT FROM NEW.raw_user_meta_data->>'role'
  THEN
    NEW.raw_user_meta_data = jsonb_set(
      NEW.raw_user_meta_data,
      '{role}',
      to_jsonb(OLD.raw_user_meta_data->>'role')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_role_metadata ON auth.users;
CREATE TRIGGER protect_role_metadata
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_change();

-- ────────────────────────────────────────────
-- 6. FIX VULN-16: Storage bucket policies — restrict to user's own folder
-- ────────────────────────────────────────────

-- community-images: restrict uploads to user's own folder
DROP POLICY IF EXISTS "community_images_upload" ON storage.objects;
CREATE POLICY "community_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'community-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ticket-images: restrict uploads to user's own folder
DROP POLICY IF EXISTS "ticket_images_upload" ON storage.objects;
CREATE POLICY "ticket_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ticket-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- knowledge-images: restrict uploads to trainer's own folder
DROP POLICY IF EXISTS "knowledge_images_upload" ON storage.objects;
CREATE POLICY "knowledge_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'knowledge-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ────────────────────────────────────────────
-- 7. FIX: increment_article_view — add search_path
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_article_view(p_article_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE knowledge_articles
  SET view_count = view_count + 1
  WHERE id = p_article_id AND is_published = true;
$$;

-- ────────────────────────────────────────────
-- 8. Atomic promo code increment function (replaces read-then-update)
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_promo_code_usage(p_promo_code_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected int;
BEGIN
  UPDATE trainer_promo_codes
  SET current_uses = current_uses + 1
  WHERE id = p_promo_code_id
    AND is_active = true
    AND (max_uses IS NULL OR current_uses < max_uses)
    AND (expires_at IS NULL OR expires_at > now());

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;
