-- 1. Ensure user_id is the primary key (required for upsert)
ALTER TABLE public.user_levels
DROP CONSTRAINT IF EXISTS user_levels_pkey;

ALTER TABLE public.user_levels
ADD PRIMARY KEY (user_id);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (to ensure clean setup)
DROP POLICY IF EXISTS "Users can read their own user levels." ON public.user_levels;
DROP POLICY IF EXISTS "Users can insert/update their own user levels." ON public.user_levels;

-- 4. Create RLS Policies

-- Policy for SELECT (Read)
CREATE POLICY "Users can read their own user levels."
ON public.user_levels FOR SELECT
USING (auth.uid() = user_id);

-- Policy for INSERT/UPDATE (Write)
-- This allows users to create their initial record and update it later.
CREATE POLICY "Users can insert/update their own user levels."
ON public.user_levels FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);