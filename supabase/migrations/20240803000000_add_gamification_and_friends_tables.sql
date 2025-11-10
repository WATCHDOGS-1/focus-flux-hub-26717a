-- 1. User Stats Table (for streaks and longest session)
CREATE TABLE user_stats (
    user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    longest_streak integer DEFAULT 0 NOT NULL,
    longest_session_minutes integer DEFAULT 0 NOT NULL,
    total_focused_minutes integer DEFAULT 0 NOT NULL,
    last_focused_date date NULL
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" ON user_stats
FOR SELECT USING (true);

CREATE POLICY "Allow user to update own stats" ON user_stats
FOR UPDATE USING (auth.uid() = user_id);

-- 2. User Levels Table (for XP and titles)
CREATE TABLE user_levels (
    user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    level integer DEFAULT 1 NOT NULL,
    total_xp integer DEFAULT 0 NOT NULL,
    title text DEFAULT 'Novice Monk' NOT NULL
);

ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" ON user_levels
FOR SELECT USING (true);

CREATE POLICY "Allow user to update own levels" ON user_levels
FOR UPDATE USING (auth.uid() = user_id);


-- 3. Friendships Table (stores confirmed friendships)
CREATE TABLE friendships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure only one friendship exists between two users (normalized)
    CONSTRAINT unique_friendship_pair UNIQUE (user1_id, user2_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Function to normalize user IDs (user1_id < user2_id)
CREATE OR REPLACE FUNCTION normalize_friendship_users()
RETURNS TRIGGER AS $$
DECLARE
    temp_id uuid;
BEGIN
    IF NEW.user1_id > NEW.user2_id THEN
        temp_id := NEW.user1_id;
        NEW.user1_id := NEW.user2_id;
        NEW.user2_id := temp_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_friendship_users_trigger
BEFORE INSERT ON friendships
FOR EACH ROW EXECUTE FUNCTION normalize_friendship_users();

-- RLS for friendships
CREATE POLICY "Enable select for friends" ON friendships
FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Enable insert for authenticated users" ON friendships
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for friends" ON friendships
FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);


-- 4. Friend Requests Table
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE friend_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status friend_request_status DEFAULT 'pending'::friend_request_status NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_request UNIQUE (sender_id, receiver_id),
    CONSTRAINT no_self_request CHECK (sender_id <> receiver_id)
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- RLS for friend_requests
CREATE POLICY "Enable insert for authenticated users" ON friend_requests
FOR INSERT WITH CHECK (auth.uid() = sender_id AND status = 'pending');

CREATE POLICY "Enable select for sender and receiver" ON friend_requests
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Enable update for receiver only" ON friend_requests
FOR UPDATE USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);