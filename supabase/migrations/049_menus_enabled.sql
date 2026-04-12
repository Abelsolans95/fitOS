-- ── Migration 049: Menu visibility toggle ────────────────────────────────────
-- Adds per-user toggle so admins can enable/disable menu (nutrition) access
-- for trainers and clients independently.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS menus_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN profiles.menus_enabled IS 'Admin toggle: when false, user cannot access nutrition/meal plan features';
