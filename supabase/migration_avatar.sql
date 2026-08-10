-- Run in Supabase SQL Editor
alter table public.profiles
  add column if not exists avatar_url text;

-- Optional: Storage bucket (Dashboard → Storage → New bucket "avatars", public)
-- Policy example for authenticated upload:
-- allow insert/update/select for auth.uid()::text = (storage.foldername(name))[1]
