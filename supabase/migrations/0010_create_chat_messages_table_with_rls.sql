-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies: All authenticated users can read and insert messages. Only the message owner can delete.
CREATE POLICY "Authenticated users can read messages" ON public.chat_messages 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert messages" ON public.chat_messages 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Message owner can delete" ON public.chat_messages 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Prevent updates to messages
CREATE POLICY "Messages cannot be updated" ON public.chat_messages 
FOR UPDATE TO authenticated USING (false);