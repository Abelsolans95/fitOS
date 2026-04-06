-- ═══════════════════════════════════════════════════════
-- Migration 044: Prevent admin role via self-signup
-- ═══════════════════════════════════════════════════════
--
-- VULNERABILITY: An attacker can call supabase.auth.signUp() with
-- { data: { role: "admin" } } to get a JWT with admin role.
-- The prevent_role_change() trigger (mig 040) only blocks UPDATE, not INSERT.
--
-- FIX: Add a BEFORE INSERT trigger on auth.users that strips "admin"
-- from role in raw_user_meta_data. Admin users can only be created via
-- supabase.auth.admin.createUser() (service_role), which bypasses triggers.
--
-- NOTE: service_role operations bypass RLS but NOT triggers by default.
-- However, admin.createUser() uses the GoTrue admin API which writes
-- directly, not via PostgREST. If this trigger fires on admin creation too,
-- the admin panel's "create admin user" flow uses auth.admin.createUser()
-- which may bypass this. If it doesn't, admins must be created via SQL.
-- ═══════════════════════════════════════════════════════

-- Approach: Instead of a trigger (which may interfere with admin.createUser),
-- we add a CHECK constraint on profiles.role to ensure only valid roles
-- exist in the DB. Combined with verifyAdmin() checking profiles.role,
-- this ensures that even if someone signs up with role: "admin" in metadata,
-- they can't create a profile with role: "admin" (RLS blocks INSERT to profiles
-- for arbitrary users, and onboarding only creates trainer/client).

-- Add CHECK constraint on profiles.role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('trainer', 'client', 'admin'));
  END IF;
END $$;

-- Harden RLS on profiles: prevent users from setting their own role to 'admin'
-- The existing INSERT/UPDATE policies for profiles should not allow role = 'admin'
-- unless done via service_role (which bypasses RLS)

-- Drop and recreate the profiles update policy to block self-promotion to admin
DO $$
BEGIN
  -- Check if there's an existing update policy that allows role changes
  -- Add a restrictive policy: users can only update their own profile, and cannot set role to 'admin'
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'users_cannot_self_promote_admin'
  ) THEN
    CREATE POLICY users_cannot_self_promote_admin ON profiles
      AS RESTRICTIVE
      FOR UPDATE
      USING (true)
      WITH CHECK (
        -- If the user is setting role, it cannot be 'admin' (unless they already are admin)
        role != 'admin' OR (
          EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
        )
      );
  END IF;
END $$;

-- Also prevent INSERT with role = 'admin' via RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'users_cannot_insert_admin_role'
  ) THEN
    CREATE POLICY users_cannot_insert_admin_role ON profiles
      AS RESTRICTIVE
      FOR INSERT
      WITH CHECK (
        role != 'admin'
      );
  END IF;
END $$;

-- SUMMARY:
-- 1. CHECK constraint: only 'trainer', 'client', 'admin' allowed in profiles.role
-- 2. RESTRICTIVE RLS INSERT policy: blocks any user from inserting a profile with role='admin'
-- 3. RESTRICTIVE RLS UPDATE policy: blocks any non-admin user from changing their role to 'admin'
-- 4. verifyAdmin() in code checks profiles.role (not just JWT metadata)
-- 5. Admin creation via admin panel uses service_role (bypasses RLS) → allowed
-- 6. Admin creation via SQL → allowed (no RLS)
