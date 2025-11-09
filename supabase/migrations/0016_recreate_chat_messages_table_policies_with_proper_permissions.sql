-- Recreate chat_messages policies
CREATE POLICY "Chat messages viewable by everyone" ON public.chat_messages 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own messages" ON public.chat_messages 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);