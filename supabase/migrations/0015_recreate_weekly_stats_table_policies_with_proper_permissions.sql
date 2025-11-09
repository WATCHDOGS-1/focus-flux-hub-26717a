-- Recreate weekly_stats policies
CREATE POLICY "Weekly stats viewable by everyone" ON public.weekly_stats 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own stats" ON public.weekly_stats 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.weekly_stats 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);