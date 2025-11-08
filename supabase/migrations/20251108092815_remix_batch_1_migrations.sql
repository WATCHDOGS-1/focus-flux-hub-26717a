
-- Migration: 20251106144624
-- Create profiles table with username-based login
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  profile_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = (SELECT id FROM public.profiles WHERE username = current_setting('request.jwt.claim.sub', true)::text LIMIT 1));

-- Create focus sessions table
CREATE TABLE public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration_minutes integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all focus sessions"
ON public.focus_sessions FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own sessions"
ON public.focus_sessions FOR INSERT
WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE username = current_setting('request.jwt.claim.sub', true)::text LIMIT 1));

CREATE POLICY "Users can update their own sessions"
ON public.focus_sessions FOR UPDATE
USING (user_id = (SELECT id FROM public.profiles WHERE username = current_setting('request.jwt.claim.sub', true)::text LIMIT 1));

-- Create weekly stats table
CREATE TABLE public.weekly_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  total_minutes integer DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly stats viewable by everyone"
ON public.weekly_stats FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own stats"
ON public.weekly_stats FOR INSERT
WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE username = current_setting('request.jwt.claim.sub', true)::text LIMIT 1));

CREATE POLICY "Users can update their own stats"
ON public.weekly_stats FOR UPDATE
USING (user_id = (SELECT id FROM public.profiles WHERE username = current_setting('request.jwt.claim.sub', true)::text LIMIT 1));

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat messages viewable by everyone"
ON public.chat_messages FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own messages"
ON public.chat_messages FOR INSERT
WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE username = current_setting('request.jwt.claim.sub', true)::text LIMIT 1));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_sessions;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Users can update their own profile photo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos');

-- Create goals tables
CREATE TABLE public.daily_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  goal_minutes integer NOT NULL,
  actual_minutes integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all daily goals"
ON public.daily_goals FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own daily goals"
ON public.daily_goals FOR ALL
USING (user_id = (SELECT id FROM public.profiles WHERE username = current_setting('request.jwt.claim.sub', true)::text LIMIT 1));

CREATE TABLE public.weekly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  goal_minutes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all weekly goals"
ON public.weekly_goals FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own weekly goals"
ON public.weekly_goals FOR ALL
USING (user_id = (SELECT id FROM public.profiles WHERE username = current_setting('request.jwt.claim.sub', true)::text LIMIT 1));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for weekly stats
CREATE TRIGGER update_weekly_stats_updated_at
BEFORE UPDATE ON public.weekly_stats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
