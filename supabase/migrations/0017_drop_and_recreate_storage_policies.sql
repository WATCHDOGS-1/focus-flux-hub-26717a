-- Drop existing storage policies
DROP POLICY IF EXISTS "Profile photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their profile photos" ON storage.objects;

-- Recreate storage policies
CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Users can update their profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can delete their profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');