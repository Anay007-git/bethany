-- 1. Create the 'calendars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('calendars', 'calendars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on objects (It is usually enabled by default, but good to ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow Public READ (So OTAs can download)
-- This allows anyone to download files from 'calendars' bucket
DROP POLICY IF EXISTS "Public Select Calendars" ON storage.objects;
CREATE POLICY "Public Select Calendars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'calendars' );

-- 4. Policy: Allow Public INSERT (So Admin Dashboard can upload)
-- WARNING: This allows anyone to upload to this bucket. 
-- In a production app with real auth, you would restrict this to authenticated admins.
-- Given the current client-side admin setup, we must allow public writes.
DROP POLICY IF EXISTS "Public Insert Calendars" ON storage.objects;
CREATE POLICY "Public Insert Calendars"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'calendars' );

-- 5. Policy: Allow Public UPDATE (So Admin Dashboard can update existing files)
DROP POLICY IF EXISTS "Public Update Calendars" ON storage.objects;
CREATE POLICY "Public Update Calendars"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'calendars' );

-- 6. Policy: Allow Public DELETE (Optional, for cleanup)
DROP POLICY IF EXISTS "Public Delete Calendars" ON storage.objects;
CREATE POLICY "Public Delete Calendars"
ON storage.objects FOR DELETE
USING ( bucket_id = 'calendars' );
