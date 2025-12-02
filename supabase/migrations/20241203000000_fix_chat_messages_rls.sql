-- Fix RLS policies for chat_messages table

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to read/write chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat messages are viewable by everyone." ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert chat messages." ON public.chat_messages;

-- Policy 1: Authenticated users can read all messages (SELECT)
CREATE POLICY "Authenticated users can read chat"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Authenticated users can insert messages (INSERT)
CREATE POLICY "Authenticated users can insert chat"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);