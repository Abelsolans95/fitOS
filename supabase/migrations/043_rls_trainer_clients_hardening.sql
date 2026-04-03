-- ============================================================
-- Migration 043: RLS Hardening — trainer_clients validation
-- ============================================================
-- Fixes: weight_log, user_routines, meal_plans, onboarding_responses,
--        messages, support_tickets — trainer policies now require
--        EXISTS (trainer_clients) to prevent access after relationship ends.
-- Also: log_audit_event validates p_user_id = auth.uid(),
--        ticket-images and knowledge-images buckets set to private.

-- ============================================================
-- 1. weight_log — trainer policy must validate trainer_clients
-- ============================================================

DROP POLICY IF EXISTS "Trainer views and edits client weight log" ON weight_log;

CREATE POLICY "trainer_weight_log_all"
  ON weight_log FOR ALL
  USING (
    auth.uid() = trainer_id
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = weight_log.client_id
    )
  )
  WITH CHECK (
    auth.uid() = trainer_id
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = weight_log.client_id
    )
  );

-- ============================================================
-- 2. user_routines — trainer policy must validate trainer_clients
-- ============================================================

DROP POLICY IF EXISTS "Trainer manages client routines" ON user_routines;

CREATE POLICY "trainer_routines_all"
  ON user_routines FOR ALL
  USING (
    auth.uid() = trainer_id
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = user_routines.client_id
    )
  )
  WITH CHECK (
    auth.uid() = trainer_id
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = user_routines.client_id
    )
  );

-- ============================================================
-- 3. meal_plans — trainer policy must validate trainer_clients
-- ============================================================

DROP POLICY IF EXISTS "Trainer manages meal plans" ON meal_plans;

CREATE POLICY "trainer_meal_plans_all"
  ON meal_plans FOR ALL
  USING (
    auth.uid() = trainer_id
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = meal_plans.client_id
    )
  )
  WITH CHECK (
    auth.uid() = trainer_id
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = meal_plans.client_id
    )
  );

-- ============================================================
-- 4. onboarding_responses — trainer policy must validate trainer_clients
-- ============================================================

DROP POLICY IF EXISTS "Trainer sees client responses" ON onboarding_responses;

CREATE POLICY "trainer_onboarding_responses_all"
  ON onboarding_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = onboarding_responses.client_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = onboarding_responses.client_id
    )
  );

-- ============================================================
-- 5. messages — trainer policies must validate trainer_clients
-- ============================================================

DROP POLICY IF EXISTS "trainer_can_read_own_messages" ON messages;
DROP POLICY IF EXISTS "trainer_can_insert_own_messages" ON messages;
DROP POLICY IF EXISTS "trainer_can_update_read_at" ON messages;

CREATE POLICY "trainer_messages_select"
  ON messages FOR SELECT
  USING (
    auth.uid() = trainer_id
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = messages.client_id
    )
  );

CREATE POLICY "trainer_messages_insert"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = trainer_id
    AND auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = messages.client_id
    )
  );

CREATE POLICY "trainer_messages_update"
  ON messages FOR UPDATE
  USING (
    auth.uid() = trainer_id
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = messages.client_id
    )
  )
  WITH CHECK (
    auth.uid() = trainer_id
  );

-- ============================================================
-- 6. support_tickets — trainer policy must validate trainer_clients
-- ============================================================

DROP POLICY IF EXISTS "trainer_tickets_all" ON support_tickets;

CREATE POLICY "trainer_tickets_all"
  ON support_tickets FOR ALL
  USING (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = support_tickets.client_id
    )
  )
  WITH CHECK (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = support_tickets.client_id
    )
  );

-- ============================================================
-- 7. log_audit_event — validate p_user_id = auth.uid()
-- ============================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY: Only allow logging events for the authenticated user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot log audit events for other users';
  END IF;

  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, target_user_id, metadata, ip_address)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_target_user_id, p_metadata, p_ip_address);
END;
$$;

-- ============================================================
-- 8. Storage buckets — set ticket-images and knowledge-images to private
-- ============================================================

UPDATE storage.buckets SET public = false WHERE id = 'ticket-images';
UPDATE storage.buckets SET public = false WHERE id = 'knowledge-images';

-- ============================================================
-- 9. increment_promo_code_usage — add caller validation
-- ============================================================

CREATE OR REPLACE FUNCTION increment_promo_code_usage(p_promo_code_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE trainer_promo_codes
  SET current_uses = current_uses + 1
  WHERE id = p_promo_code_id
    AND is_active = true
    AND current_uses < max_uses;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Promo code not found, inactive, or at max uses';
  END IF;
END;
$$;

-- Revoke direct execution from public — only callable via service_role or authenticated during registration
-- The complete-registration API route uses service_role, so this is still functional
REVOKE EXECUTE ON FUNCTION increment_promo_code_usage(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION increment_promo_code_usage(UUID) FROM authenticated;
