-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS social_links jsonb;

-- Add target_minutes column to daily_goals (keeping goal_minutes for backwards compatibility)
ALTER TABLE public.daily_goals
ADD COLUMN IF NOT EXISTS target_minutes integer;

-- Add target_minutes column to weekly_goals (keeping goal_minutes for backwards compatibility)
ALTER TABLE public.weekly_goals
ADD COLUMN IF NOT EXISTS target_minutes integer;

-- Copy existing goal_minutes values to target_minutes for daily_goals
UPDATE public.daily_goals SET target_minutes = goal_minutes WHERE target_minutes IS NULL;

-- Copy existing goal_minutes values to target_minutes for weekly_goals
UPDATE public.weekly_goals SET target_minutes = goal_minutes WHERE target_minutes IS NULL;