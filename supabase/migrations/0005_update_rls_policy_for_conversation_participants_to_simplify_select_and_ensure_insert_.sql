-- Drop existing policy if it exists to replace it
DROP POLICY IF EXISTS "Users can view participants of conversations they are in." ON public.conversation_participants;

-- Create a simpler SELECT policy for conversation_participants
CREATE POLICY "Users can view participants of conversations they are in." ON public.conversation_participants
FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.conversation_participants cp2 WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()));

-- Ensure INSERT policy is correctly defined (if not already)
CREATE POLICY "Users can insert participants for conversations they are in." ON public.conversation_participants
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.conversation_participants cp2 WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()));