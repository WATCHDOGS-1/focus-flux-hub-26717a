-- Create profiles table IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  username text,
  profile_photo_url text,
  PRIMARY KEY (id)
);
-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create focus_sessions table IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  start_time timestamp with time zone NOT NULL DEFAULT now(),
  end_time timestamp with time zone,
  duration_minutes integer,
  PRIMARY KEY (id)
);
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own sessions." ON public.focus_sessions;
CREATE POLICY "Users can manage their own sessions." ON public.focus_sessions FOR ALL USING (auth.uid() = user_id);

-- Create chat_messages table IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all messages." ON public.chat_messages;
CREATE POLICY "Users can view all messages." ON public.chat_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own messages." ON public.chat_messages;
CREATE POLICY "Users can insert their own messages." ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create daily_goals table IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.daily_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  target_minutes integer NOT NULL,
  date date NOT NULL,
  PRIMARY KEY (id)
);
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own daily goals." ON public.daily_goals;
CREATE POLICY "Users can manage their own daily goals." ON public.daily_goals FOR ALL USING (auth.uid() = user_id);

-- Create weekly_goals table IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.weekly_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  target_minutes integer NOT NULL,
  week_start date NOT NULL,
  PRIMARY KEY (id)
);
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own weekly goals." ON public.weekly_goals;
CREATE POLICY "Users can manage their own weekly goals." ON public.weekly_goals FOR ALL USING (auth.uid() = user_id);

-- Create weekly_stats table IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.weekly_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  week_start date NOT NULL,
  total_minutes integer NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
);
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all weekly stats." ON public.weekly_stats;
CREATE POLICY "Users can view all weekly stats." ON public.weekly_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own weekly stats." ON public.weekly_stats;
CREATE POLICY "Users can manage their own weekly stats." ON public.weekly_stats FOR ALL USING (auth.uid() = user_id);

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, profile_photo_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Set up Storage for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Profile photos are publicly accessible." ON storage.objects;
CREATE POLICY "Profile photos are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-photos' );

DROP POLICY IF EXISTS "Anyone can upload a profile photo." ON storage.objects;
CREATE POLICY "Anyone can upload a profile photo."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'profile-photos' );

DROP POLICY IF EXISTS "Anyone can update their own profile photo." ON storage.objects;
CREATE POLICY "Anyone can update their own profile photo."
ON storage.objects FOR UPDATE
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'profile-photos' );