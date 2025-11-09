-- Create daily_goals table
CREATE TABLE public.daily_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_minutes INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one goal per user per day
  UNIQUE (user_id, date)
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only manage their own daily goals.
CREATE POLICY "Users can only see their own daily goals" ON public.daily_goals 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily goals" ON public.daily_goals 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily goals" ON public.daily_goals 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily goals" ON public.daily_goals 
FOR DELETE TO authenticated USING (auth.uid() = user_id);