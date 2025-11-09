-- Recreate focus_sessions policies
CREATE POLICY "Users can view all focus sessions" ON public.focus_sessions 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own sessions" ON public.focus_sessions 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.focus_sessions 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);