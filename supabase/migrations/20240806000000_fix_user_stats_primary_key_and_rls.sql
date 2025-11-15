-- 1. Ensure user_id is the primary key (required for upsert)
ALTER TABLE public.user_stats
DROP CONSTRAINT IF EXISTS user_stats_pkey;

ALTER TABLE public.user_stats
ADD PRIMARY KEY (user_id);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (to ensure clean setup)
DROP POLICY IF EXISTS "Users can read their own user stats." ON public.user_stats;
DROP POLICY IF EXISTS "Users can insert/update their own user stats." ON public.user_stats;

-- 4. Create RLS Policies

-- Policy for SELECT (Read)
CREATE POLICY "Users can read their own user stats."
ON public.user_stats FOR SELECT
USING (auth.uid() = user_id);

-- Policy for INSERT/UPDATE (Write)
-- This allows users to create their initial record and update it later.
CREATE POLICY "Users can insert/update their own user stats."
ON public.user_stats FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);