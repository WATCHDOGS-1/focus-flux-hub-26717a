ALTER TABLE public.profiles
ADD COLUMN twitter_handle text NULL,
ADD COLUMN instagram_handle text NULL,
ADD COLUMN github_handle text NULL;

-- Ensure RLS policy allows authenticated users to update these new columns
-- Assuming the existing RLS policy on profiles allows authenticated users to UPDATE their own row:
-- CREATE POLICY "Allow authenticated users to update their own profile." ON public.profiles
-- FOR UPDATE TO authenticated USING (auth.uid() = id);
-- If that policy exists, no further RLS changes are needed here.