-- 1. Ensure 'user_post' exists (it is required for the Focus Feed posting feature)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
                   WHERE t.typname = 'feed_item_type' AND e.enumlabel = 'user_post') THEN
        -- Assuming 'achievement_unlocked' is a stable existing value to anchor the new value
        ALTER TYPE public.feed_item_type ADD VALUE 'user_post' AFTER 'achievement_unlocked';
    END IF;
END $$;

-- 2. Add 'partner_request' to the feed_item_type enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
                   WHERE t.typname = 'feed_item_type' AND e.enumlabel = 'partner_request') THEN
        -- Now we can safely use 'user_post' as the anchor
        ALTER TYPE public.feed_item_type ADD VALUE 'partner_request' AFTER 'user_post';
    END IF;
END $$;

-- Ensure RLS policies are robust for feed_items table

-- 1. Allow authenticated users to insert their own feed items
DROP POLICY IF EXISTS "Allow authenticated users to insert feed items" ON public.feed_items;
CREATE POLICY "Allow authenticated users to insert feed items"
ON public.feed_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Allow all authenticated users to SELECT feed items
DROP POLICY IF EXISTS "Allow all users to view feed items" ON public.feed_items;
CREATE POLICY "Allow all users to view feed items"
ON public.feed_items
FOR SELECT
TO authenticated
USING (true);

-- 3. Allow owner to update their own posts
DROP POLICY IF EXISTS "Allow owner to update their own posts" ON public.feed_items;
CREATE POLICY "Allow owner to update their own posts"
ON public.feed_items
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Allow owner to delete their own posts
DROP POLICY IF EXISTS "Allow owner to delete their own posts" ON public.feed_items;
CREATE POLICY "Allow owner to delete their own posts"
ON public.feed_items
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);