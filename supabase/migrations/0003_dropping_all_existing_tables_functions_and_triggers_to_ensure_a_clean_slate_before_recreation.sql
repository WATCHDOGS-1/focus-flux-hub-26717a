-- Drop trigger associated with user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop custom functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.normalize_friendship_pair(user1 uuid, user2 uuid) CASCADE;

-- Drop all tables using CASCADE to handle foreign key dependencies
DROP TABLE IF EXISTS public.daily_goals CASCADE;
DROP TABLE IF EXISTS public.weekly_goals CASCADE;
DROP TABLE IF EXISTS public.weekly_stats CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.focus_sessions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;