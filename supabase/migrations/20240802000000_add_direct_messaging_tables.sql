-- 1. DM Conversations table
CREATE TABLE dm_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id uuid REFERENCES profiles(id) NOT NULL,
    user2_id uuid REFERENCES profiles(id) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure only one conversation exists between two users (regardless of order)
    CONSTRAINT unique_conversation_pair UNIQUE (user1_id, user2_id)
);

-- 2. Enable RLS on dm_conversations
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for dm_conversations
-- Users can only see conversations they are a part of
CREATE POLICY "Enable select for users in conversation" ON dm_conversations
FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can insert new conversations
CREATE POLICY "Enable insert for authenticated users" ON dm_conversations
FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 4. DM Messages table
CREATE TABLE dm_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES dm_conversations(id) NOT NULL,
    sender_id uuid REFERENCES profiles(id) NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS on dm_messages
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for dm_messages
-- Users can only insert messages if they are the sender
CREATE POLICY "Enable insert for sender" ON dm_messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can only select messages if they are part of the conversation
CREATE POLICY "Enable select for conversation participants" ON dm_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM dm_conversations
        WHERE dm_conversations.id = conversation_id
        AND (dm_conversations.user1_id = auth.uid() OR dm_conversations.user2_id = auth.uid())
    )
);


-- 7. Create a function to ensure user1_id < user2_id for unique constraint consistency
CREATE OR REPLACE FUNCTION normalize_conversation_users()
RETURNS TRIGGER AS $$
DECLARE
    temp_id uuid;
BEGIN
    -- If user1_id is lexicographically greater than user2_id, swap them
    IF NEW.user1_id > NEW.user2_id THEN
        temp_id := NEW.user1_id;
        NEW.user1_id := NEW.user2_id;
        NEW.user2_id := temp_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 8. Apply the trigger before insert on dm_conversations
CREATE TRIGGER normalize_conversation_users_trigger
BEFORE INSERT ON dm_conversations
FOR EACH ROW EXECUTE FUNCTION normalize_conversation_users();