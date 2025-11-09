-- Recreate weekly_goals policies
CREATE POLICY "Users can manage their own weekly goals" ON public.weekly_goals 
FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view all weekly goals" ON public.weekly_goals 
FOR SELECT USING (true);