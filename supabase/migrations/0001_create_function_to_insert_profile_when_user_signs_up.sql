CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Extract username from metadata if available (e.g., Google full_name) or use a default
  -- Note: Discord ID is typically handled in the client after OAuth redirect, but we initialize the profile here.
  
  -- Use email prefix as a temporary username if full_name/name is missing
  -- We assume the client will update the username later if needed (as seen in Auth.tsx)
  
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id, 
    COALESCE(
      new.raw_user_meta_data ->> 'full_name', 
      new.raw_user_meta_data ->> 'name',
      SPLIT_PART(new.email, '@', 1) || '_' || SUBSTRING(new.id::text, 1, 4)
    )
  );
  RETURN new;
END;
$$;

-- Trigger the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();