-- This migration ensures the 'interests' column exists and forces a PostgREST schema cache refresh.

-- 1. Add the 'interests' column if it is missing. We use JSONB for better performance.
-- Using IF NOT EXISTS prevents errors if the column was partially created.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interests jsonb NULL;

-- 2. Drop and re-create the update policy to force schema cache refresh
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);