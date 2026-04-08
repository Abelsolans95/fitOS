-- Migration 046: Marketplace tables for routine products
-- Trainers publish routines as digital products; anyone can browse/buy.

-- ─── Products table ───────────────────────────────────────────────────────────

CREATE TABLE marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  category TEXT NOT NULL CHECK (category IN ('hipertrofia','fuerza','perdida_peso','funcional','calistenia','otro')),
  routine_data JSONB NOT NULL,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','published','rejected')),
  downloads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Purchases table ──────────────────────────────────────────────────────────

CREATE TABLE marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE RESTRICT,
  buyer_email TEXT NOT NULL,
  license_key TEXT NOT NULL UNIQUE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX idx_marketplace_products_trainer ON marketplace_products(trainer_id);
CREATE INDEX idx_marketplace_purchases_product ON marketplace_purchases(product_id);
CREATE INDEX idx_marketplace_purchases_license ON marketplace_purchases(license_key);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE TRIGGER set_marketplace_products_updated_at
  BEFORE UPDATE ON marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read published products
CREATE POLICY marketplace_products_public_read ON marketplace_products
  FOR SELECT
  USING (status = 'published');

-- Trainers: full CRUD on own products (any status)
CREATE POLICY marketplace_products_trainer_all ON marketplace_products
  FOR ALL
  TO authenticated
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Purchases: only service_role inserts (from API route)
-- No direct user access to purchases table
CREATE POLICY marketplace_purchases_service_only ON marketplace_purchases
  FOR SELECT
  TO authenticated
  USING (false);

-- ─── Atomic download increment ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_marketplace_downloads(p_product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE marketplace_products
  SET downloads = downloads + 1
  WHERE id = p_product_id AND status = 'published';
END;
$$;

-- Only service_role should call this
REVOKE ALL ON FUNCTION increment_marketplace_downloads(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION increment_marketplace_downloads(UUID) FROM authenticated;
