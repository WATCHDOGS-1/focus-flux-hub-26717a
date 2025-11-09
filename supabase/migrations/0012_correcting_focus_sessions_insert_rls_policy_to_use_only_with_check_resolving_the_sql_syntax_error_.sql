-- Drop the existing policy first
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.focus_sessions;

-- Recreate the policy using only WITH CHECK for INSERT
CREATE POLICY "Users can insert their own sessions" ON public.focus_sessions 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);