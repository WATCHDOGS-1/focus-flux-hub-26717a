-- 1. Create live_status enum
CREATE TYPE public.live_status AS ENUM ('focusing', 'break', 'offline');

-- 2. Create user_live_status table
CREATE TABLE public.user_live_status (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.live_status NOT NULL DEFAULT 'offline',
    current_tag text,
    session_ends_at timestamp with time zone,
    last_updated timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_live_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_live_status:
-- Users can insert/update their own status
CREATE POLICY "Users can manage their own live status"
ON public.user_live_status
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- All authenticated users can read all live statuses (for accountability/leaderboard)
CREATE POLICY "Authenticated users can read all live statuses"
ON public.user_live_status
FOR SELECT
TO authenticated
USING (true);


-- 3. Create projects table (for structured focus tags/projects)
CREATE TABLE public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    
    UNIQUE (user_id, name)
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects:
-- Users can manage their own projects
CREATE POLICY "Users can manage their own projects"
ON public.projects
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 4. Alter chat_messages table to add tag column
ALTER TABLE public.chat_messages
ADD COLUMN tag text;

-- Add index for faster filtering by tag
CREATE INDEX idx_chat_messages_tag ON public.chat_messages (tag);


-- 5. Alter focus_sessions table to ensure tag column exists and is indexed
-- This block ensures the 'tag' column exists, which is crucial for the useActiveTags hook.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='focus_sessions' AND column_name='tag') THEN
        ALTER TABLE public.focus_sessions
        ADD COLUMN tag text;
    END IF;
END $$;

CREATE INDEX idx_focus_sessions_tag ON public.focus_sessions (tag);