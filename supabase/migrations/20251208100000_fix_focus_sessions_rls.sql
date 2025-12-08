-- 1. Enable RLS on the focus_sessions table
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy allowing authenticated users to insert new sessions
-- The user must be logged in, and the user_id column must match their auth.uid()
CREATE POLICY "Authenticated users can insert their own focus sessions"
ON public.focus_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. (Optional but recommended) Create a policy allowing users to read their own sessions
CREATE POLICY "Users can view their own focus sessions"
ON public.focus_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. (Optional but recommended) Create a policy allowing users to update their own sessions (e.g., setting end_time)
CREATE POLICY "Users can update their own focus sessions"
ON public.focus_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);