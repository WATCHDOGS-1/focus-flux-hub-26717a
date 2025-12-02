-- Fix RLS for circle_members table
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

-- Policy to allow members to read all circle members
DROP POLICY IF EXISTS "Allow members to read all circle members" ON public.circle_members;
CREATE POLICY "Allow members to read all circle members"
ON public.circle_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.circle_members AS cm
    WHERE cm.circle_id = circle_members.circle_id
      AND cm.user_id = auth.uid()
  )
);

-- Fix RLS for circle_messages table
ALTER TABLE public.circle_messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow circle members to read messages
DROP POLICY IF EXISTS "Allow circle members to read messages" ON public.circle_messages;
CREATE POLICY "Allow circle members to read messages"
ON public.circle_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.circle_members AS cm
    WHERE cm.circle_id = circle_messages.circle_id
      AND cm.user_id = auth.uid()
  )
);

-- Policy to allow circle members to insert messages
DROP POLICY IF EXISTS "Allow circle members to insert messages" ON public.circle_messages;
CREATE POLICY "Allow circle members to insert messages"
ON public.circle_messages
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1
    FROM public.circle_members AS cm
    WHERE cm.circle_id = circle_messages.circle_id
      AND cm.user_id = auth.uid()
  )
);