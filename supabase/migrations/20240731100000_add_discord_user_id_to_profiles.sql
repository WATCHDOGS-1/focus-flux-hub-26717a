ALTER TABLE public.profiles
ADD COLUMN discord_provider_id TEXT UNIQUE;

-- Optional: Add an index for faster lookups if you plan to query by discord_provider_id frequently
CREATE INDEX profiles_discord_provider_id_idx ON public.profiles (discord_provider_id);