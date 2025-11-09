-- Drop the current INSERT policy for user_achievements
DROP POLICY IF EXISTS "Users can insert their own achievements." ON public.user_achievements;

-- Recreate the INSERT policy with WITH CHECK (true) to revert to the previous state
CREATE POLICY "Users can insert their own achievements." ON public.user_achievements
FOR INSERT TO authenticated WITH CHECK (true);