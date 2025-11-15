-- This migration attempts to force a PostgREST schema cache refresh
-- by making a minor, non-breaking change to the profiles table.

-- 1. Ensure the 'interests' column is explicitly nullable (if it wasn't already)
ALTER TABLE public.profiles
ALTER COLUMN interests DROP NOT NULL;

-- 2. Re-enable RLS and re-create the update policy (redundant, but sometimes helps)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to update their own profile (username, interests)
CREATE OR REPLACE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Grant explicit usage on the table to the authenticated role (safety measure)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;