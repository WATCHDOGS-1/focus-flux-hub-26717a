-- WARNING: This script will DELETE ALL DATA in the specified tables.
-- Please back up any important data before running this script.

-- Drop existing policies and tables in reverse order of dependency
DROP POLICY IF EXISTS "Users can manage their own weekly stats." ON public.weekly_stats;
DROP TABLE IF EXISTS public.weekly_stats CASCADE;

-- Explicitly drop user_stats if it exists, as it's not in types.ts
DROP TABLE IF EXISTS public.user_stats CASCADE;

DROP POLICY IF EXISTS "Users can manage their own weekly goals." ON public.weekly_goals;
DROP TABLE IF EXISTS public.weekly_goals CASCADE;

DROP POLICY IF EXISTS "Users can manage their own focus sessions." ON public.focus_sessions;
DROP TABLE IF EXISTS public.focus_sessions CASCADE;

DROP POLICY IF EXISTS "Users can manage their own daily goals." ON public.daily_goals;
DROP TABLE IF EXISTS public.daily_goals CASCADE;

DROP POLICY IF EXISTS "Users can insert their own chat messages." ON public.chat_messages;
DROP POLICY IF EXISTS "Chat messages are viewable by everyone." ON public.chat_messages;
DROP TABLE IF EXISTS public.chat_messages CASCADE;

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recreate tables with their original schema

-- profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  profile_photo_url text,
  PRIMARY KEY (id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- chat_messages table
CREATE TABLE public.chat_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat messages are viewable by everyone." ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert their own chat messages." ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- daily_goals table
CREATE TABLE public.daily_goals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_minutes integer NOT NULL,
  date date NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, date)
);
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own daily goals." ON public.daily_goals FOR ALL USING (auth.uid() = user_id);

-- focus_sessions table
CREATE TABLE public.focus_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time timestamp with time zone DEFAULT now() NOT NULL,
  end_time timestamp with time zone,
  duration_minutes integer,
  PRIMARY KEY (id)
);
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own focus sessions." ON public.focus_sessions FOR ALL USING (auth.uid() = user_id);

-- weekly_goals table
CREATE TABLE public.weekly_goals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_minutes integer NOT NULL,
  week_start date NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, week_start)
);
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own weekly goals." ON public.weekly_goals FOR ALL USING (auth.uid() = user_id);

-- weekly_stats table
CREATE TABLE public.weekly_stats (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  total_minutes integer DEFAULT 0 NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, week_start)
);
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own weekly stats." ON public.weekly_stats FOR ALL USING (auth.uid() = user_id);