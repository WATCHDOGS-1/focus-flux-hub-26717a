-- Set user_id as the primary key for user_levels table
ALTER TABLE public.user_levels
DROP CONSTRAINT IF EXISTS user_levels_pkey;

ALTER TABLE public.user_levels
ADD PRIMARY KEY (user_id);

-- Ensure the foreign key constraint is still valid (it should be, as it's already defined)
-- The existing foreign key constraint is: user_levels_user_id_fkey