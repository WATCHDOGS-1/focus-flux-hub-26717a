-- Drop the current INSERT policy for conversation_participants
DROP POLICY IF EXISTS "Users can insert participants for conversations they are in." ON public.conversation_participants;

-- Recreate the INSERT policy with WITH CHECK (true) to revert to the previous state
CREATE POLICY "Users can insert participants for conversations they are in." ON public.conversation_participants
FOR INSERT TO authenticated WITH CHECK (true);