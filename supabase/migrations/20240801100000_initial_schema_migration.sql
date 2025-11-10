-- Create profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    username text NOT NULL,
    profile_photo_url text NULL,
    discord_user_id text NULL,
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Set up RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create focus_sessions table
CREATE TABLE public.focus_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    start_time timestamp with time zone NOT NULL DEFAULT now(),
    end_time timestamp with time zone NULL,
    duration_minutes integer NULL
);

-- Set up RLS for focus_sessions
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions."
  ON public.focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions."
  ON public.focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions."
  ON public.focus_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Set up RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat messages are viewable by everyone."
  ON public.chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Users can insert chat messages."
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create weekly_stats table
CREATE TABLE public.weekly_stats (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    week_start date NOT NULL,
    total_minutes integer NOT NULL DEFAULT 0,
    CONSTRAINT unique_user_week UNIQUE (user_id, week_start)
);

-- Set up RLS for weekly_stats
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly stats are viewable by everyone."
  ON public.weekly_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own weekly stats."
  ON public.weekly_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly stats."
  ON public.weekly_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Create daily_goals table
CREATE TABLE public.daily_goals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_minutes integer NOT NULL,
    date date NOT NULL,
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Set up RLS for daily_goals
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily goals."
  ON public.daily_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily goals."
  ON public.daily_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily goals."
  ON public.daily_goals FOR UPDATE
  USING (auth.uid() = user_id);

-- Create weekly_goals table
CREATE TABLE public.weekly_goals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_minutes integer NOT NULL,
    week_start date NOT NULL,
    CONSTRAINT unique_user_week_goal UNIQUE (user_id, week_start)
);

-- Set up RLS for weekly_goals
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly goals."
  ON public.weekly_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly goals."
  ON public.weekly_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly goals."
  ON public.weekly_goals FOR UPDATE
  USING (auth.uid() = user_id);

-- Set up function to create profile on new user sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run handle_new_user function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();