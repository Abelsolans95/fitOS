-- 036: Add gender column to profiles for anatomy map image selection
-- Values: 'male', 'female'

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;

-- No CHECK constraint — keep flexible like other TEXT fields in profiles
-- Default NULL means "not specified yet" — UI will prompt user to choose
