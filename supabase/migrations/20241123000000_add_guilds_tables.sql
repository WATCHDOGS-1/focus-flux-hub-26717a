-- Create guilds table
CREATE TABLE IF NOT EXISTS guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guild_members table
CREATE TABLE IF NOT EXISTS guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(guild_id, user_id)
);

-- Enable RLS
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guilds
CREATE POLICY "Users can view all guilds"
  ON guilds FOR SELECT
  USING (true);

CREATE POLICY "Users can create guilds"
  ON guilds FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Guild owners can update their guilds"
  ON guilds FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Guild owners can delete their guilds"
  ON guilds FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for guild_members
CREATE POLICY "Users can view guild members"
  ON guild_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join guilds"
  ON guild_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave guilds"
  ON guild_members FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guilds_owner_id ON guilds(owner_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_guild_id ON guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_user_id ON guild_members(user_id);

-- Function to automatically delete guild when owner leaves
CREATE OR REPLACE FUNCTION delete_guild_on_owner_leave()
RETURNS TRIGGER AS $$
BEGIN
  -- If the leaving member is the owner, delete the guild
  IF OLD.role = 'owner' THEN
    DELETE FROM guilds WHERE id = OLD.guild_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to delete guild when owner leaves
CREATE TRIGGER trigger_delete_guild_on_owner_leave
  BEFORE DELETE ON guild_members
  FOR EACH ROW
  EXECUTE FUNCTION delete_guild_on_owner_leave();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on guilds
CREATE TRIGGER update_guilds_updated_at
  BEFORE UPDATE ON guilds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
