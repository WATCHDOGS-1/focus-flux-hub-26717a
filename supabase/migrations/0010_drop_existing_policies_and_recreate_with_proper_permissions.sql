-- Drop all existing policies first
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view all focus sessions" ON public.focus_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.focus_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.focus_sessions;

DROP POLICY IF EXISTS "Users can manage their own daily goals" ON public.daily_goals;
DROP POLICY IF EXISTS "Users can view all daily goals" ON public.daily_goals;

DROP POLICY IF EXISTS "Users can manage their own weekly goals" ON public.weekly_goals;
DROP POLICY IF EXISTS "Users can view all weekly goals" ON public.weekly_goals;

DROP POLICY IF EXISTS "Weekly stats viewable by everyone" ON public.weekly_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON public.weekly_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON public.weekly_stats;

DROP POLICY IF EXISTS "Chat messages viewable by everyone" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;