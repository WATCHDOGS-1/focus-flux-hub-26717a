-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements viewable by everyone" ON public.achievements
  FOR SELECT USING (true);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all achievements" ON public.user_achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  target_minutes integer NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges viewable by everyone" ON public.challenges
  FOR SELECT USING (true);

-- Create user_challenges table
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_progress_minutes integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all challenge progress" ON public.user_challenges
  FOR SELECT USING (true);

CREATE POLICY "Users can join challenges" ON public.user_challenges
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress" ON public.user_challenges
  FOR UPDATE USING (user_id = auth.uid());

-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id_2 uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (user_id_1 < user_id_2),
  UNIQUE(user_id_1, user_id_2)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships" ON public.friendships
  FOR SELECT USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

CREATE POLICY "Users can create friendships" ON public.friendships
  FOR INSERT WITH CHECK (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

CREATE POLICY "Users can update their own friendships" ON public.friendships
  FOR UPDATE USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON public.conversation_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join conversations" ON public.conversation_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create private_messages table
CREATE TABLE IF NOT EXISTS public.private_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" ON public.private_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = private_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.private_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = private_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone authenticated can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);