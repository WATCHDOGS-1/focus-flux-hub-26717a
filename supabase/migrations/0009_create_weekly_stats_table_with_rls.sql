-- Create weekly_stats table
CREATE TABLE public.weekly_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Should be the start date of the week (e.g., Sunday)
  total_minutes INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one stats entry per user per week
  UNIQUE (user_id, week_start)
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;

-- Policies: All authenticated users can read the stats for the leaderboard. Users can only update their own stats.
CREATE POLICY "Authenticated users can read weekly stats" ON public.weekly_stats 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own weekly stats" ON public.weekly_stats 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly stats" ON public.weekly_stats 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users cannot delete weekly stats" ON public.weekly_stats 
FOR DELETE TO authenticated USING (false); -- Prevent deletion