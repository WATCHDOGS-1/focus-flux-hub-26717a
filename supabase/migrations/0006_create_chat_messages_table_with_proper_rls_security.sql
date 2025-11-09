-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "Chat messages viewable by everyone" ON public.chat_messages 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own messages" ON public.chat_messages 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);