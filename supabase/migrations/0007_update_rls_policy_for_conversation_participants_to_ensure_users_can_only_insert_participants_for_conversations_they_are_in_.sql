-- Drop the existing INSERT policy for conversation_participants if it exists
DROP POLICY IF EXISTS "Users can insert participants for conversations they are in." ON public.conversation_participants;

-- Recreate the INSERT policy with the correct WITH CHECK clause
CREATE POLICY "Users can insert participants for conversations they are in." ON public.conversation_participants
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.conversation_participants cp2 WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()));