-- Create weekly_goals table
CREATE TABLE public.weekly_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_minutes INTEGER NOT NULL,
  week_start DATE NOT NULL, -- Should be the start date of the week (e.g., Sunday)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one goal per user per week
  UNIQUE (user_id, week_start)
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only manage their own weekly goals.
CREATE POLICY "Users can only see their own weekly goals" ON public.weekly_goals 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly goals" ON public.weekly_goals 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly goals" ON public.weekly_goals 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly goals" ON public.weekly_goals 
FOR DELETE TO authenticated USING (auth.uid() = user_id);