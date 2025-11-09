-- Recreate profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles 
FOR UPDATE TO authenticated USING (auth.uid() = id);