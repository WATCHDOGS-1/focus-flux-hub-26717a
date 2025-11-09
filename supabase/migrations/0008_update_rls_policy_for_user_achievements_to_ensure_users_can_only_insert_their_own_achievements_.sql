-- Drop the existing INSERT policy for user_achievements if it exists
DROP POLICY IF EXISTS "Users can insert their own achievements." ON public.user_achievements;

-- Recreate the INSERT policy with the correct WITH CHECK clause
CREATE POLICY "Users can insert their own achievements." ON public.user_achievements
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);