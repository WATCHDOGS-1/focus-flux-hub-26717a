-- DM Conversations table
CREATE TABLE dm_conversations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id uuid REFERENCES profiles(id) NOT NULL,
    user2_id uuid REFERENCES profiles(id) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure only one conversation exists between two users (regardless of order)
    CONSTRAINT unique_conversation_pair UNIQUE (user1_id, user2_id),
    
    -- RLS policies
    -- Users can only see conversations they are a part of
    POLICY "Enable select for users in conversation" ON dm_conversations
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id)
);

-- DM Messages table
CREATE TABLE dm_messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id uuid REFERENCES dm_conversations(id) NOT NULL,
    sender_id uuid REFERENCES profiles(id) NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- RLS policies
    -- Users can only insert messages if they are the sender
    POLICY "Enable insert for sender" ON dm_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id),
    
    -- Users can only select messages if they are part of the conversation
    POLICY "Enable select for conversation participants" ON dm_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM dm_conversations
            WHERE dm_conversations.id = conversation_id
            AND (dm_conversations.user1_id = auth.uid() OR dm_conversations.user2_id = auth.uid())
        )
    )
);

-- Create a function to ensure user1_id < user2_id for unique constraint consistency
CREATE OR REPLACE FUNCTION normalize_conversation_users()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user1_id > NEW.user2_id THEN
        NEW.user1_id = OLD.user2_id;
        NEW.user2_id = OLD.user1_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger before insert on dm_conversations
CREATE TRIGGER normalize_conversation_users_trigger
BEFORE INSERT ON dm_conversations
FOR EACH ROW EXECUTE FUNCTION normalize_conversation_users();