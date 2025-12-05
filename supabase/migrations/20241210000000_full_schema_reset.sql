-- =================================================================================
-- FULL SCHEMA RESET AND RECREATION (CORRECTED)
-- This script drops all existing tables, enums, and functions in the public schema
-- and recreates the entire structure with robust Row Level Security (RLS).
-- =================================================================================

-- 1. DROP EXISTING OBJECTS (CASCADE is used for safety)
-----------------------------------------------------------------------------------

DROP TABLE IF EXISTS public.circle_messages CASCADE;
DROP TABLE IF EXISTS public.circle_members CASCADE;
DROP TABLE IF EXISTS public.circles CASCADE;
DROP TABLE IF EXISTS public.feed_applauds CASCADE;
DROP TABLE IF EXISTS public.feed_items CASCADE;
DROP TABLE IF EXISTS public.dm_messages CASCADE;
DROP TABLE IF EXISTS public.dm_conversations CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.friend_requests CASCADE;
DROP TABLE IF EXISTS public.focus_sessions CASCADE;
DROP TABLE IF EXISTS public.daily_goals CASCADE;
DROP TABLE IF EXISTS public.weekly_goals CASCADE;
DROP TABLE IF EXISTS public.weekly_stats CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.user_levels CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.normalize_friendship_insert() CASCADE;
DROP FUNCTION IF EXISTS public.normalize_dm_conversation_insert() CASCADE;

DROP TYPE IF EXISTS public.friend_request_status CASCADE;
DROP TYPE IF EXISTS public.feed_item_type CASCADE;

-- 2. CREATE ENUMS
-----------------------------------------------------------------------------------

CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.feed_item_type AS ENUM ('session_completed', 'achievement_unlocked', 'user_post');

-- 3. CREATE TABLES
-----------------------------------------------------------------------------------

-- Profiles (Linked to auth.users)
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text NOT NULL UNIQUE,
    profile_photo_url text,
    discord_user_id text UNIQUE,
    interests jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User Stats (Gamification)
CREATE TABLE public.user_stats (
    user_id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    longest_streak integer DEFAULT 0 NOT NULL,
    longest_session_minutes integer DEFAULT 0 NOT NULL,
    total_focused_minutes integer DEFAULT 0 NOT NULL,
    last_focused_date date
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- User Levels (Gamification)
CREATE TABLE public.user_levels (
    user_id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    level integer DEFAULT 1 NOT NULL,
    total_xp integer DEFAULT 0 NOT NULL,
    title text DEFAULT 'Novice'::text NOT NULL
);
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- Focus Sessions
CREATE TABLE public.focus_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time timestamp with time zone DEFAULT now() NOT NULL,
    end_time timestamp with time zone,
    duration_minutes integer,
    tag text
);
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Weekly Stats (For Leaderboard)
CREATE TABLE public.weekly_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start date NOT NULL,
    total_minutes integer DEFAULT 0 NOT NULL,
    UNIQUE (user_id, week_start)
);
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;

-- Daily Goals
CREATE TABLE public.daily_goals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_minutes integer NOT NULL,
    date date NOT NULL,
    UNIQUE (user_id, date)
);
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- Weekly Goals
CREATE TABLE public.weekly_goals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_minutes integer NOT NULL,
    week_start date NOT NULL,
    UNIQUE (user_id, week_start)
);
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

-- Friend Requests
CREATE TABLE public.friend_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status friend_request_status DEFAULT 'pending'::friend_request_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (sender_id, receiver_id)
);
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Friendships (Normalized: user1_id < user2_id)
CREATE TABLE public.friendships (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user1_id, user2_id),
    CHECK (user1_id < user2_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- DM Conversations (Normalized: user1_id < user2_id)
CREATE TABLE public.dm_conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user1_id, user2_id),
    CHECK (user1_id < user2_id)
);
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;

-- DM Messages
CREATE TABLE public.dm_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

-- Global Chat Messages
CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Feed Items
CREATE TABLE public.feed_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type feed_item_type NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

-- Feed Applauds
CREATE TABLE public.feed_applauds (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    feed_item_id uuid NOT NULL REFERENCES public.feed_items(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (feed_item_id, user_id)
);
ALTER TABLE public.feed_applauds ENABLE ROW LEVEL SECURITY;

-- Reports (Moderation)
CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_type text NOT NULL,
    content_id text, -- ID of the content (chat/video/etc)
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Study Circles (Currently disabled in UI, but included for completeness)
CREATE TABLE public.circles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.circle_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member'::text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (circle_id, user_id)
);
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.circle_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.circle_messages ENABLE ROW LEVEL SECURITY;


-- 4. CREATE FUNCTIONS AND TRIGGERS
-----------------------------------------------------------------------------------

-- Function to create a profile entry when a new user signs up via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email); -- Use email as initial username, will be sanitized later
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run handle_new_user on new auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Function to ensure friendship user IDs are stored in canonical order (user1_id < user2_id)
CREATE OR REPLACE FUNCTION public.normalize_friendship_insert()
RETURNS trigger AS $$
BEGIN
    IF NEW.user1_id > NEW.user2_id THEN
        NEW.user1_id := NEW.user2_id;
        NEW.user2_id := OLD.user1_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to normalize friendship IDs before insert/update
CREATE TRIGGER normalize_friendship_ids
BEFORE INSERT OR UPDATE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.normalize_friendship_insert();

-- Function to ensure DM conversation user IDs are stored in canonical order (user1_id < user2_id)
CREATE OR REPLACE FUNCTION public.normalize_dm_conversation_insert()
RETURNS trigger AS $$
BEGIN
    IF NEW.user1_id > NEW.user2_id THEN
        NEW.user1_id := NEW.user2_id;
        NEW.user2_id := OLD.user1_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to normalize DM conversation IDs before insert/update
CREATE TRIGGER normalize_dm_conversation_ids
BEFORE INSERT OR UPDATE ON public.dm_conversations
FOR EACH ROW EXECUTE FUNCTION public.normalize_dm_conversation_insert();


-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-----------------------------------------------------------------------------------

-- Profiles
CREATE POLICY "Public profiles are viewable by all authenticated users." ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile (via trigger fallback)." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Focus Sessions
CREATE POLICY "Owners can manage their focus sessions." ON public.focus_sessions
  FOR ALL USING (auth.uid() = user_id);

-- User Stats, Levels, Goals, Weekly Stats (Read access for all authenticated users for leaderboards)
CREATE POLICY "Authenticated users can read all user stats." ON public.user_stats
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Owners can manage their user stats." ON public.user_stats
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read all user levels." ON public.user_levels
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Owners can manage their user levels." ON public.user_levels
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Owners can manage their daily goals." ON public.daily_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Owners can manage their weekly goals." ON public.weekly_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read all weekly stats." ON public.weekly_stats
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Owners can manage their weekly stats." ON public.weekly_stats
  FOR ALL USING (auth.uid() = user_id);

-- Friendships and Requests
CREATE POLICY "Owners can manage their friend requests." ON public.friend_requests
  FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Owners can manage their friendships." ON public.friendships
  FOR ALL USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- DM Conversations and Messages
CREATE POLICY "Conversation members can manage conversations." ON public.dm_conversations
  FOR ALL USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Conversation members can manage messages." ON public.dm_messages
  FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.dm_conversations
        WHERE dm_conversations.id = dm_messages.conversation_id
          AND (dm_conversations.user1_id = auth.uid() OR dm_conversations.user2_id = auth.uid())
    )
  );

-- Global Chat Messages
CREATE POLICY "Authenticated users can read global chat." ON public.chat_messages
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can send global chat messages." ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Feed Items and Applauds
CREATE POLICY "Authenticated users can read feed items." ON public.feed_items
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Owners can manage their own feed items." ON public.feed_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read feed applauds." ON public.feed_applauds
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert/delete applauds." ON public.feed_applauds
  FOR ALL USING (auth.uid() = user_id);

-- Reports (Moderation)
CREATE POLICY "Authenticated users can submit reports." ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Study Circles
CREATE POLICY "Circle members can read circle data." ON public.circles
  FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM public.circle_members
        WHERE circle_members.circle_id = circles.id
          AND circle_members.user_id = auth.uid()
    )
  );
CREATE POLICY "Owners can manage their circles." ON public.circles
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Circle members can read members list." ON public.circle_members
  FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM public.circle_members AS cm
        WHERE cm.circle_id = circle_members.circle_id
          AND cm.user_id = auth.uid()
    )
  );
CREATE POLICY "Authenticated users can insert/delete circle membership." ON public.circle_members
  FOR ALL USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.circles WHERE circles.id = circle_id AND circles.owner_id = auth.uid()));

CREATE POLICY "Circle members can manage circle messages." ON public.circle_messages
  FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.circle_members
        WHERE circle_members.circle_id = circle_messages.circle_id
          AND circle_members.user_id = auth.uid()
    )
  );