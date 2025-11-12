-- Add interests column to profiles table
ALTER TABLE public.profiles
ADD COLUMN interests jsonb NULL;

-- Optional: Add RLS policy if needed (assuming RLS is already set up for profiles)
-- If RLS is already set up, this column will inherit the existing policies.