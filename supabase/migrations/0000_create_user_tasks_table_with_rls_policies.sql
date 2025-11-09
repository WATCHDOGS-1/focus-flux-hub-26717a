-- Create user_tasks table
CREATE TABLE public.user_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  due_date DATE,
  recurrence TEXT DEFAULT 'none' NOT NULL, -- 'none', 'daily', 'weekly', 'monthly'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "Users can view their own tasks" ON public.user_tasks
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON public.user_tasks
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.user_tasks
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.user_tasks
FOR DELETE TO authenticated USING (auth.uid() = user_id);