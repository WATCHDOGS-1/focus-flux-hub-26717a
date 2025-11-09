-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.focus_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.focus_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.focus_sessions;

DROP POLICY IF EXISTS "Users can view all daily goals" ON public.daily_goals;
DROP POLICY IF EXISTS "Users can manage their own daily goals" ON public.daily_goals;

DROP POLICY IF EXISTS "Users can view all weekly goals" ON public.weekly_goals;
DROP POLICY IF EXISTS "Users can manage their own weekly goals" ON public.weekly_goals;

DROP POLICY IF EXISTS "Weekly stats viewable by everyone" ON public.weekly_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON public.weekly_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON public.weekly_stats;

DROP POLICY IF EXISTS "Chat messages viewable by everyone" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles 
FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Create policies for focus_sessions
CREATE POLICY "Users can view their own sessions" ON public.focus_sessions 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.focus_sessions 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.focus_sessions 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create policies for daily_goals
CREATE POLICY "Users can view all daily goals" ON public.daily_goals 
FOR SELECT USING (true);

CREATE POLICY "Users can manage their own daily goals" ON public.daily_goals 
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create policies for weekly_goals
CREATE POLICY "Users can view all weekly goals" ON public.weekly_goals 
FOR SELECT USING (true);

CREATE POLICY "Users can manage their own weekly goals" ON public.weekly_goals 
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create policies for weekly_stats
CREATE POLICY "Weekly stats viewable by everyone" ON public.weekly_stats 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own stats" ON public.weekly_stats 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.weekly_stats 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create policies for chat_messages
CREATE POLICY "Chat messages viewable by everyone" ON public.chat_messages 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own messages" ON public.chat_messages 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);