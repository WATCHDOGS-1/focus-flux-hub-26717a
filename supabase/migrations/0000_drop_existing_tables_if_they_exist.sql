-- Drop existing tables in correct order to avoid foreign key constraints
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.weekly_stats CASCADE;
DROP TABLE IF EXISTS public.daily_goals CASCADE;
DROP TABLE IF EXISTS public.weekly_goals CASCADE;
DROP TABLE IF EXISTS public.focus_sessions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;