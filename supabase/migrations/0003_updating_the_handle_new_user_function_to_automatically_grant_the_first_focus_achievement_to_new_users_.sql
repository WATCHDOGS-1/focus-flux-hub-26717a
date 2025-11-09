CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  first_focus_achievement_id UUID;
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, username, profile_photo_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Get the ID of the 'First Focus' achievement
  SELECT id INTO first_focus_achievement_id
  FROM public.achievements
  WHERE name = 'First Focus';

  -- If the achievement exists, grant it to the new user
  IF first_focus_achievement_id IS NOT NULL THEN
    INSERT INTO public.user_achievements (user_id, achievement_id, earned_at)
    VALUES (new.id, first_focus_achievement_id, NOW())
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;