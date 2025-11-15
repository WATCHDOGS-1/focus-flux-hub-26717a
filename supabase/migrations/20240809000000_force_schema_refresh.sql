-- This migration attempts to force a PostgREST schema cache refresh
-- by making a minor, non-breaking change to the profiles table and re-applying RLS.

-- 1. Ensure the 'interests' column is explicitly nullable (if it wasn't already)
ALTER TABLE public.profiles
ALTER COLUMN interests DROP NOT NULL;

-- 2. Drop and re-create the update policy to force schema cache refresh
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);