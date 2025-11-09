-- Alter profiles table for expanded user profiles
ALTER TABLE public.profiles
ADD COLUMN bio TEXT,
ADD COLUMN interests TEXT[], -- Array of text for interests
ADD COLUMN social_links JSONB; -- JSONB for flexible social links (e.g., { "twitter": "...", "linkedin": "..." })

-- Create friendships table
CREATE TABLE public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id_1, user_id_2),
    CHECK (user_id_1 != user_id_2) -- Users cannot be friends with themselves
);

-- RLS for friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own and accepted friendships" ON public.friendships
FOR SELECT USING (
    (auth.uid() = user_id_1 OR auth.uid() = user_id_2) AND status = 'accepted'
    OR
    (auth.uid() = user_id_1 AND status = 'pending') -- User can see their outgoing pending requests
    OR
    (auth.uid() = user_id_2 AND status = 'pending') -- User can see incoming pending requests
);

CREATE POLICY "Users can insert friendship requests" ON public.friendships
FOR INSERT WITH CHECK (auth.uid() = user_id_1 AND status = 'pending');

CREATE POLICY "Users can update their friendship status" ON public.friendships
FOR UPDATE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2); -- Ensure only involved users can update

CREATE POLICY "Users can delete their friendships" ON public.friendships
FOR DELETE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);


-- Create conversations table for private messages
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a junction table for conversation participants
CREATE TABLE public.conversation_participants (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (conversation_id, user_id)
);

-- RLS for conversations and participants
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON public.conversations
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = public.conversations.id AND user_id = auth.uid())
);

CREATE POLICY "Users can create conversations" ON public.conversations
FOR INSERT WITH CHECK (true); -- Logic for participants will be handled in application

CREATE POLICY "Users can delete their conversations" ON public.conversations
FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = public.conversations.id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage their conversation participants" ON public.conversation_participants
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- Create private_messages table
CREATE TABLE public.private_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for private_messages
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" ON public.private_messages
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = public.private_messages.conversation_id AND user_id = auth.uid())
);

CREATE POLICY "Users can send messages in their conversations" ON public.private_messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = public.private_messages.conversation_id AND user_id = auth.uid())
);


-- Create achievements table
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_url TEXT,
    criteria_type TEXT NOT NULL, -- e.g., 'total_minutes', 'sessions_completed', 'leaderboard_top_3'
    criteria_value JSONB NOT NULL, -- e.g., { "minutes": 600 } or { "rank": 3 }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for achievements (publicly readable)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are public" ON public.achievements FOR SELECT USING (true);


-- Create user_achievements table
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, achievement_id)
);

-- RLS for user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON public.user_achievements
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
FOR INSERT WITH CHECK (auth.uid() = user_id);


-- Create challenges table
CREATE TABLE public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    target_minutes INTEGER NOT NULL,
    reward_achievement_id UUID REFERENCES public.achievements(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for challenges (publicly readable)
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges are public" ON public.challenges FOR SELECT USING (true);


-- Create user_challenges table
CREATE TABLE public.user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    current_progress_minutes INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, challenge_id)
);

-- RLS for user_challenges
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenge progress" ON public.user_challenges
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges" ON public.user_challenges
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their challenge progress" ON public.user_challenges
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- Create reports table for moderation
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Can be null if reporting a message from an unknown user or system
    reported_message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL, -- Can be null if reporting a user directly
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'action_taken'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert reports" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.reports
FOR SELECT USING (auth.uid() = reporter_id);

-- Note: For admin access to reports, you would typically add a policy like:
-- CREATE POLICY "Admins can view all reports" ON public.reports
-- FOR SELECT USING (auth.role() = 'admin');
-- This requires setting up roles in Supabase, which is beyond the scope of this request.