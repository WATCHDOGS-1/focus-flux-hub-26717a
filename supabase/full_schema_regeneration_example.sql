-- WARNING: This script will permanently delete all data in the public schema.
-- Use only for development or testing purposes.

-- 1. DROP ALL EXISTING OBJECTS (CASCADE)
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS "public"."feed_applauds" CASCADE;
DROP TABLE IF EXISTS "public"."feed_items" CASCADE;
DROP TABLE IF EXISTS "public"."circle_messages" CASCADE;
DROP TABLE IF EXISTS "public"."circle_members" CASCADE;
DROP TABLE IF EXISTS "public"."circles" CASCADE;
DROP TABLE IF EXISTS "public"."dm_messages" CASCADE;
DROP TABLE IF EXISTS "public"."dm_conversations" CASCADE;
DROP TABLE IF EXISTS "public"."friendships" CASCADE;
DROP TABLE IF EXISTS "public"."friend_requests" CASCADE;
DROP TABLE IF EXISTS "public"."focus_sessions" CASCADE;
DROP TABLE IF EXISTS "public"."daily_goals" CASCADE;
DROP TABLE IF EXISTS "public"."weekly_goals" CASCADE;
DROP TABLE IF EXISTS "public"."weekly_stats" CASCADE;
DROP TABLE IF EXISTS "public"."chat_messages" CASCADE;
DROP TABLE IF EXISTS "public"."user_levels" CASCADE;
DROP TABLE IF EXISTS "public"."user_stats" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;

DROP TYPE IF EXISTS "public"."friend_request_status" CASCADE;
DROP TYPE IF EXISTS "public"."feed_item_type" CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS "public"."handle_new_user"() CASCADE;
DROP FUNCTION IF EXISTS "public"."create_friendship_on_accept"() CASCADE;
DROP FUNCTION IF EXISTS "public"."create_feed_item_on_session_end"() CASCADE;
DROP FUNCTION IF EXISTS "public"."normalize_friendship_insert"() CASCADE;


-- 2. EXTENSIONS AND ENUMS
--------------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE "public"."friend_request_status" AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE "public"."feed_item_type" AS ENUM ('session_completed', 'achievement_unlocked');


-- 3. CORE TABLES (Profiles, Stats, Levels)
--------------------------------------------------------------------------------

-- Profiles table (linked to auth.users)
CREATE TABLE "public"."profiles" (
    "id" uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "username" text NOT NULL UNIQUE,
    "profile_photo_url" text,
    "discord_user_id" text UNIQUE,
    "interests" jsonb DEFAULT '{"focus_class": "None"}'::jsonb,
    CONSTRAINT "username_length" CHECK (char_length(username) >= 3)
);

-- User Stats (for streaks, longest session)
CREATE TABLE "public"."user_stats" (
    "user_id" uuid NOT NULL PRIMARY KEY REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "longest_streak" integer DEFAULT 0 NOT NULL,
    "longest_session_minutes" integer DEFAULT 0 NOT NULL,
    "total_focused_minutes" integer DEFAULT 0 NOT NULL,
    "last_focused_date" date
);

-- User Levels (for XP, title)
CREATE TABLE "public"."user_levels" (
    "user_id" uuid NOT NULL PRIMARY KEY REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "level" integer DEFAULT 1 NOT NULL,
    "total_xp" integer DEFAULT 0 NOT NULL,
    "title" text DEFAULT 'Novice' NOT NULL
);


-- 4. FOCUS & GOALS TABLES
--------------------------------------------------------------------------------

-- Focus Sessions
CREATE TABLE "public"."focus_sessions" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "start_time" timestamp with time zone DEFAULT now() NOT NULL,
    "end_time" timestamp with time zone,
    "duration_minutes" integer,
    "tag" text
);
CREATE INDEX idx_focus_sessions_user_id ON public.focus_sessions (user_id);
CREATE INDEX idx_focus_sessions_start_time ON public.focus_sessions (start_time);

-- Daily Goals
CREATE TABLE "public"."daily_goals" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "target_minutes" integer DEFAULT 60 NOT NULL,
    "date" date DEFAULT CURRENT_DATE NOT NULL,
    UNIQUE ("user_id", "date")
);

-- Weekly Goals
CREATE TABLE "public"."weekly_goals" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "target_minutes" integer DEFAULT 420 NOT NULL,
    "week_start" date NOT NULL,
    UNIQUE ("user_id", "week_start")
);

-- Weekly Stats (for Leaderboard)
CREATE TABLE "public"."weekly_stats" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "week_start" date NOT NULL,
    "total_minutes" integer DEFAULT 0 NOT NULL,
    UNIQUE ("user_id", "week_start")
);
CREATE INDEX idx_weekly_stats_minutes ON public.weekly_stats (total_minutes DESC);


-- 5. SOCIAL TABLES (Friends, DMs, Global Chat)
--------------------------------------------------------------------------------

-- Friend Requests
CREATE TABLE "public"."friend_requests" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "sender_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "receiver_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "status" "public"."friend_request_status" DEFAULT 'pending' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE ("sender_id", "receiver_id"),
    CONSTRAINT "no_self_request" CHECK (sender_id <> receiver_id)
);

-- Friendships (Confirmed friends)
CREATE TABLE "public"."friendships" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user1_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "user2_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE ("user1_id", "user2_id"),
    CONSTRAINT "ordered_users" CHECK (user1_id < user2_id)
);

-- DM Conversations
CREATE TABLE "public"."dm_conversations" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user1_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "user2_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE ("user1_id", "user2_id"),
    CONSTRAINT "ordered_dm_users" CHECK (user1_id < user2_id)
);

-- DM Messages
CREATE TABLE "public"."dm_messages" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "conversation_id" uuid NOT NULL REFERENCES "public"."dm_conversations"("id") ON DELETE CASCADE,
    "sender_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "content" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX idx_dm_messages_conversation_id ON public.dm_messages (conversation_id);

-- Global Chat Messages
CREATE TABLE "public"."chat_messages" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "message" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages (created_at DESC);


-- 6. STUDY CIRCLES TABLES
--------------------------------------------------------------------------------

-- Circles
CREATE TABLE "public"."circles" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" text NOT NULL,
    "description" text,
    "owner_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE RESTRICT,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Circle Members
CREATE TABLE "public"."circle_members" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "circle_id" uuid NOT NULL REFERENCES "public"."circles"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "role" text DEFAULT 'member' NOT NULL,
    "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE ("circle_id", "user_id")
);

-- Circle Messages
CREATE TABLE "public"."circle_messages" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "circle_id" uuid NOT NULL REFERENCES "public"."circles"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "content" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);


-- 7. FOCUS FEED TABLES
--------------------------------------------------------------------------------

-- Feed Items
CREATE TABLE "public"."feed_items" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "type" "public"."feed_item_type" NOT NULL,
    "data" jsonb, -- e.g., { "duration": 25, "tag": "Programming" }
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX idx_feed_items_created_at ON public.feed_items (created_at DESC);

-- Feed Applauds
CREATE TABLE "public"."feed_applauds" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "feed_item_id" uuid NOT NULL REFERENCES "public"."feed_items"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE ("feed_item_id", "user_id")
);


-- 8. FUNCTIONS AND TRIGGERS
--------------------------------------------------------------------------------

-- Function to create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email); -- Use email as initial username
  
  -- Initialize stats and levels
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
  INSERT INTO public.user_levels (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run handle_new_user on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();


-- Function to ensure user IDs in friendships are always stored in order (user1_id < user2_id)
CREATE OR REPLACE FUNCTION "public"."normalize_friendship_insert"()
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


-- Function to create a friendship record when a request is accepted
CREATE OR REPLACE FUNCTION "public"."create_friendship_on_accept"()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Insert into friendships table (normalize_friendship_insert trigger handles ordering)
    INSERT INTO public.friendships (user1_id, user2_id)
    VALUES (NEW.sender_id, NEW.receiver_id)
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run create_friendship_on_accept on friend_requests update
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE PROCEDURE public.create_friendship_on_accept();


-- Function to create a feed item when a focus session ends
CREATE OR REPLACE FUNCTION "public"."create_feed_item_on_session_end"()
RETURNS trigger AS $$
BEGIN
  IF NEW.duration_minutes IS NOT NULL AND NEW.duration_minutes >= 1 THEN
    INSERT INTO public.feed_items (user_id, type, data)
    VALUES (
      NEW.user_id, 
      'session_completed', 
      jsonb_build_object('duration', NEW.duration_minutes, 'tag', NEW.tag)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run create_feed_item_on_session_end on focus_sessions update
CREATE TRIGGER on_focus_session_ended
  AFTER UPDATE ON public.focus_sessions
  FOR EACH ROW
  WHEN (NEW.end_time IS NOT NULL AND OLD.end_time IS NULL)
  EXECUTE PROCEDURE public.create_feed_item_on_session_end();


-- 9. ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_applauds ENABLE ROW LEVEL SECURITY;


-- Helper function to check if two users are friends
CREATE OR REPLACE FUNCTION "public"."is_friend"(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user1_id = user_a AND user2_id = user_b)
       OR (user1_id = user_b AND user2_id = user_a)
  );
$$;


-- PROFILES RLS
CREATE POLICY "Allow all authenticated users to view profiles" ON "public"."profiles"
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow users to insert/update their own profile" ON "public"."profiles"
FOR ALL USING (auth.uid() = id);

-- USER STATS / LEVELS RLS (Allow owner and friends to read)
CREATE POLICY "Allow owner and friends to read user stats" ON "public"."user_stats"
FOR SELECT USING (
  auth.uid() = user_id OR public.is_friend(auth.uid(), user_id)
);
CREATE POLICY "Allow owner to update user stats" ON "public"."user_stats"
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow owner and friends to read user levels" ON "public"."user_levels"
FOR SELECT USING (
  auth.uid() = user_id OR public.is_friend(auth.uid(), user_id)
);
CREATE POLICY "Allow owner to update user levels" ON "public"."user_levels"
FOR UPDATE USING (auth.uid() = user_id);

-- FOCUS SESSIONS RLS
CREATE POLICY "Allow owner to manage focus sessions" ON "public"."focus_sessions"
FOR ALL USING (auth.uid() = user_id);

-- GOALS RLS
CREATE POLICY "Allow owner to manage daily goals" ON "public"."daily_goals"
FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow owner to manage weekly goals" ON "public"."weekly_goals"
FOR ALL USING (auth.uid() = user_id);

-- WEEKLY STATS RLS (Public read for leaderboard, owner update)
CREATE POLICY "Allow authenticated users to read weekly stats" ON "public"."weekly_stats"
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow owner to update weekly stats" ON "public"."weekly_stats"
FOR ALL USING (auth.uid() = user_id);

-- FRIENDSHIP RLS
CREATE POLICY "Allow owner to manage friend requests" ON "public"."friend_requests"
FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Allow owner to manage friendships" ON "public"."friendships"
FOR ALL USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- DM RLS
CREATE POLICY "Allow participants to manage conversations" ON "public"."dm_conversations"
FOR ALL USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Allow participants to manage DM messages" ON "public"."dm_messages"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.dm_conversations
    WHERE dm_conversations.id = conversation_id
      AND (dm_conversations.user1_id = auth.uid() OR dm_conversations.user2_id = auth.uid())
  )
);

-- GLOBAL CHAT RLS
CREATE POLICY "Allow authenticated users to read global chat" ON "public"."chat_messages"
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert global chat" ON "public"."chat_messages"
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CIRCLES RLS
CREATE POLICY "Allow authenticated users to read circles" ON "public"."circles"
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert circles" ON "public"."circles"
FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Allow owner to update/delete circles" ON "public"."circles"
FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Allow circle members to read/insert members" ON "public"."circle_members"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_members.circle_id = circle_members.circle_id
      AND circle_members.user_id = auth.uid()
  )
);

CREATE POLICY "Allow circle members to manage messages" ON "public"."circle_messages"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_members.circle_id = circle_messages.circle_id
      AND circle_members.user_id = auth.uid()
  )
);

-- FEED RLS
CREATE POLICY "Allow authenticated users to read feed items" ON "public"."feed_items"
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service role to insert feed items" ON "public"."feed_items"
FOR INSERT WITH CHECK (auth.role() = 'service_role'); -- Inserted via trigger

CREATE POLICY "Allow authenticated users to manage applauds" ON "public"."feed_applauds"
FOR ALL USING (auth.uid() = user_id);