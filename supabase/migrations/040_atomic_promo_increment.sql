-- Migration 040: Atomic promo code increment
-- Fixes race condition in read-then-write pattern for promo code uses

CREATE OR REPLACE FUNCTION increment_promo_code_uses(p_promo_code_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE trainer_promo_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = p_promo_code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (RLS on the table still applies for reads)
GRANT EXECUTE ON FUNCTION increment_promo_code_uses(UUID) TO authenticated;
