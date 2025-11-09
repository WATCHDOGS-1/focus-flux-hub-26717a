ALTER TABLE public.profiles
ADD COLUMN discord_user_id TEXT UNIQUE;

-- Optional: Add an index for faster lookups if you plan to query by discord_user_id frequently
CREATE INDEX profiles_discord_user_id_idx ON public.profiles (discord_user_id);