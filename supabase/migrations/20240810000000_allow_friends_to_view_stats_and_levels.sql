-- Enable RLS on tables if not already enabled
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- 1. Policy for user_stats
-- Drop existing SELECT policy if it only allows self-read
DROP POLICY IF EXISTS "Allow authenticated users to read their own user_stats." ON public.user_stats;

-- Create new policy: Allow read if owner OR if they are friends
CREATE POLICY "Allow friends and self to read user_stats."
ON public.user_stats FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) OR
  EXISTS (
    SELECT 1
    FROM public.friendships
    WHERE (
      (friendships.user1_id = auth.uid() AND friendships.user2_id = user_id) OR
      (friendships.user2_id = auth.uid() AND friendships.user1_id = user_id)
    )
  )
);

-- 2. Policy for user_levels
-- Drop existing SELECT policy if it only allows self-read
DROP POLICY IF EXISTS "Allow authenticated users to read their own user_levels." ON public.user_levels;

-- Create new policy: Allow read if owner OR if they are friends
CREATE POLICY "Allow friends and self to read user_levels."
ON public.user_levels FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) OR
  EXISTS (
    SELECT 1
    FROM public.friendships
    WHERE (
      (friendships.user1_id = auth.uid() AND friendships.user2_id = user_id) OR
      (friendships.user2_id = auth.uid() AND friendships.user1_id = user_id)
    )
  )
);