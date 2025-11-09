-- Recreate daily_goals policies
CREATE POLICY "Users can manage their own daily goals" ON public.daily_goals 
FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view all daily goals" ON public.daily_goals 
FOR SELECT USING (true);