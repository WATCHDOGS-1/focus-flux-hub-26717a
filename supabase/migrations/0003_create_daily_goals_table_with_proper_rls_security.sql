-- Create daily_goals table
CREATE TABLE public.daily_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_minutes INTEGER NOT NULL,
  date DATE NOT NULL
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "Users can manage their own daily goals" ON public.daily_goals 
FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view all daily goals" ON public.daily_goals 
FOR SELECT USING (true);