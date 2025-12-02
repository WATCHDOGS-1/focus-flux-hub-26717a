-- Create ENUM for feed item types
DO $$ BEGIN
    CREATE TYPE public.feed_item_type AS ENUM ('session_completed', 'achievement_unlocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Circles Table
CREATE TABLE IF NOT EXISTS public.circles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all authenticated users to view circles" ON public.circles;
CREATE POLICY "Allow all authenticated users to view circles" ON public.circles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow owners to insert, update, delete" ON public.circles;
CREATE POLICY "Allow owners to insert, update, delete" ON public.circles FOR ALL USING (auth.uid() = owner_id);

-- 2. Circle Members Table
CREATE TABLE IF NOT EXISTS public.circle_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member' NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (circle_id, user_id)
);
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
-- Members can view all members of their circle
DROP POLICY IF EXISTS "Members can view their circle memberships" ON public.circle_members;
CREATE POLICY "Members can view their circle memberships" ON public.circle_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.circle_members AS cm WHERE cm.circle_id = circle_members.circle_id AND cm.user_id = auth.uid()));
-- Authenticated users can join circles (insert) - MUST check that the user_id being inserted is the current user
DROP POLICY IF EXISTS "Authenticated users can join circles" ON public.circle_members;
CREATE POLICY "Authenticated users can join circles" ON public.circle_members FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Members can leave circles (delete)
DROP POLICY IF EXISTS "Members can leave circles" ON public.circle_members;
CREATE POLICY "Members can leave circles" ON public.circle_members FOR DELETE USING (auth.uid() = user_id);

-- 3. Circle Messages Table
CREATE TABLE IF NOT EXISTS public.circle_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.circle_messages ENABLE ROW LEVEL SECURITY;
-- Only members of the circle can view or insert messages
DROP POLICY IF EXISTS "Members can view circle messages" ON public.circle_messages;
CREATE POLICY "Members can view circle messages" ON public.circle_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.circle_members WHERE circle_id = circle_messages.circle_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Members can insert circle messages" ON public.circle_messages;
CREATE POLICY "Members can insert circle messages" ON public.circle_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.circle_members WHERE circle_id = circle_messages.circle_id AND user_id = auth.uid()));

-- 4. Focus Feed Items Table
CREATE TABLE IF NOT EXISTS public.feed_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.feed_item_type NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
-- Feed is public read
DROP POLICY IF EXISTS "Feed is public read" ON public.feed_items;
CREATE POLICY "Feed is public read" ON public.feed_items FOR SELECT USING (true);
-- Allow authenticated insert for testing/trigger
DROP POLICY IF EXISTS "Allow authenticated insert for testing" ON public.feed_items;
CREATE POLICY "Allow authenticated insert for testing" ON public.feed_items FOR INSERT WITH CHECK (auth.uid() = user_id); -- Changed to check auth.uid() = user_id for security
-- Note: The trigger handles insertion, but this policy ensures no one can manually insert for another user.

-- 5. Feed Applauds Table
CREATE TABLE IF NOT EXISTS public.feed_applauds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_item_id uuid NOT NULL REFERENCES public.feed_items(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (feed_item_id, user_id)
);
ALTER TABLE public.feed_applauds ENABLE ROW LEVEL SECURITY;
-- Applauds are public read, authenticated insert/delete
DROP POLICY IF EXISTS "Applauds are public read" ON public.feed_applauds;
CREATE POLICY "Applauds are public read" ON public.feed_applauds FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can applaud" ON public.feed_applauds;
CREATE POLICY "Authenticated users can applaud" ON public.feed_applauds FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove their own applauds" ON public.feed_applauds;
CREATE POLICY "Users can remove their own applauds" ON public.feed_applauds FOR DELETE USING (auth.uid() = user_id);

-- 6. Crucial: Add SELECT policy for profiles to allow joins in feed/chat/circles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read basic profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to read basic profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

-- 7. Update focus_sessions table to include a trigger for feed item creation
CREATE OR REPLACE FUNCTION public.handle_session_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.duration_minutes IS NOT NULL AND OLD.duration_minutes IS NULL AND NEW.duration_minutes > 0 THEN
        INSERT INTO public.feed_items (user_id, type, data)
        VALUES (
            NEW.user_id,
            'session_completed',
            jsonb_build_object(
                'duration', NEW.duration_minutes,
                'tag', NEW.tag
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_session_update ON public.focus_sessions;
CREATE TRIGGER on_session_update
AFTER UPDATE OF duration_minutes ON public.focus_sessions
FOR EACH ROW EXECUTE FUNCTION public.handle_session_completion();