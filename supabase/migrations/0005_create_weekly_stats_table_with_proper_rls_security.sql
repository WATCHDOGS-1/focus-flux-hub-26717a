-- Create weekly_stats table
CREATE TABLE public.weekly_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  total_minutes INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "Weekly stats viewable by everyone" ON public.weekly_stats 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own stats" ON public.weekly_stats 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.weekly_stats 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);