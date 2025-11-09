-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Profile photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their profile photos" ON storage.objects;