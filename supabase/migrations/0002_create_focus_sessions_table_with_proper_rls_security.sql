-- Create focus_sessions table
CREATE TABLE public.focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "Users can view all focus sessions" ON public.focus_sessions 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own sessions" ON public.focus_sessions 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.focus_sessions 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);