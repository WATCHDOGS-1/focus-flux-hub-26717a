-- RLS Fixes for Profiles, Daily Goals, and Weekly Goals

-- 1. Profiles Table RLS (for Username and Interests)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can read all profiles." ON public.profiles;

-- Allow authenticated users to read all profiles (needed for chat/leaderboard/friends)
CREATE POLICY "Users can read all profiles."
ON public.profiles FOR SELECT
USING (true);

-- Allow users to update their own profile (username, interests)
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- 2. Daily Goals Table RLS
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own daily goals." ON public.daily_goals;

-- Ensure primary key is set for upserting daily goals (user_id, date)
ALTER TABLE public.daily_goals
DROP CONSTRAINT IF EXISTS daily_goals_pkey;

ALTER TABLE public.daily_goals
ADD PRIMARY KEY (user_id, date);

-- Allow users to insert, select, and update their own daily goals
CREATE POLICY "Users can manage their own daily goals."
ON public.daily_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 3. Weekly Goals Table RLS
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own weekly goals." ON public.weekly_goals;

-- Ensure primary key is set for upserting weekly goals (user_id, week_start)
ALTER TABLE public.weekly_goals
DROP CONSTRAINT IF EXISTS weekly_goals_pkey;

ALTER TABLE public.weekly_goals
ADD PRIMARY KEY (user_id, week_start);

-- Allow users to insert, select, and update their own weekly goals
CREATE POLICY "Users can manage their own weekly goals."
ON public.weekly_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);