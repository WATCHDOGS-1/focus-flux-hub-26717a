-- ============================================
-- ONLYFOCUS GUILDS SYSTEM - COMPLETE SQL SETUP
-- ============================================
-- Copy and paste this entire file into your Supabase SQL Editor
-- Then click "Run" to create all tables and policies
-- ============================================

-- Step 1: Create guilds table
CREATE TABLE IF NOT EXISTS public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create guild_members table
CREATE TABLE IF NOT EXISTS public.guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(guild_id, user_id)
);

-- Step 3: Enable Row Level Security
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all guilds" ON public.guilds;
DROP POLICY IF EXISTS "Users can create guilds" ON public.guilds;
DROP POLICY IF EXISTS "Guild owners can update their guilds" ON public.guilds;
DROP POLICY IF EXISTS "Guild owners can delete their guilds" ON public.guilds;
DROP POLICY IF EXISTS "Users can view guild members" ON public.guild_members;
DROP POLICY IF EXISTS "Users can join guilds" ON public.guild_members;
DROP POLICY IF EXISTS "Users can leave guilds" ON public.guild_members;

-- Step 5: Create RLS Policies for guilds
CREATE POLICY "Users can view all guilds"
  ON public.guilds FOR SELECT
  USING (true);

CREATE POLICY "Users can create guilds"
  ON public.guilds FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Guild owners can update their guilds"
  ON public.guilds FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Guild owners can delete their guilds"
  ON public.guilds FOR DELETE
  USING (auth.uid() = owner_id);

-- Step 6: Create RLS Policies for guild_members
CREATE POLICY "Users can view guild members"
  ON public.guild_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join guilds"
  ON public.guild_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave guilds"
  ON public.guild_members FOR DELETE
  USING (auth.uid() = user_id);

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guilds_owner_id ON public.guilds(owner_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_guild_id ON public.guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_user_id ON public.guild_members(user_id);

-- Step 8: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to update updated_at on guilds
DROP TRIGGER IF EXISTS update_guilds_updated_at ON public.guilds;
CREATE TRIGGER update_guilds_updated_at
  BEFORE UPDATE ON public.guilds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 10: Create function to automatically delete guild when owner leaves
CREATE OR REPLACE FUNCTION public.delete_guild_on_owner_leave()
RETURNS TRIGGER AS $$
BEGIN
  -- If the leaving member is the owner, delete the guild
  IF OLD.role = 'owner' THEN
    DELETE FROM public.guilds WHERE id = OLD.guild_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create trigger to delete guild when owner leaves
DROP TRIGGER IF EXISTS trigger_delete_guild_on_owner_leave ON public.guild_members;
CREATE TRIGGER trigger_delete_guild_on_owner_leave
  BEFORE DELETE ON public.guild_members
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_guild_on_owner_leave();

-- ============================================
-- VERIFICATION QUERIES (Optional - Run these to verify setup)
-- ============================================
-- Uncomment and run these one at a time to verify everything is working:

-- Check if tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('guilds', 'guild_members');

-- Check if policies exist:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('guilds', 'guild_members');

-- Check if indexes exist:
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('guilds', 'guild_members');

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Now you can:
-- 1. Go to your app at http://localhost:8080
-- 2. Navigate to /social
-- 3. Click on the "Guilds" tab
-- 4. Create a new guild!
-- ============================================
