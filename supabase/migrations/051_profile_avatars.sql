-- 051_profile_avatars.sql
-- Adds avatar_url to profiles + creates a private storage bucket "avatars"
-- restricted to the user's own folder.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN profiles.avatar_url IS
  'Signed URL or storage path to the profile photo. NULL fallback renders initials.';

-- Storage bucket: private (public=false) — reads go through signed URLs or RLS.
-- Folder convention: `${auth.uid()}/avatar.{ext}` to scope writes per user.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  5 * 1024 * 1024, -- 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: writes only to your own folder. Reads follow RLS of the reader.
DROP POLICY IF EXISTS avatars_owner_insert ON storage.objects;
CREATE POLICY avatars_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_owner_update ON storage.objects;
CREATE POLICY avatars_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_owner_delete ON storage.objects;
CREATE POLICY avatars_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Reads: owner + anyone with an active trainer_clients relation to the file owner.
-- Trainer sees client photos; client sees trainer photos; everyone sees their own.
DROP POLICY IF EXISTS avatars_read ON storage.objects;
CREATE POLICY avatars_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM trainer_clients tc
        WHERE tc.status = 'active'
          AND (
            (tc.trainer_id = auth.uid() AND tc.client_id::text = (storage.foldername(name))[1])
            OR (tc.client_id = auth.uid() AND tc.trainer_id::text = (storage.foldername(name))[1])
          )
      )
    )
  );
