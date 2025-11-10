CREATE TABLE user_workspace (
    user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    content text DEFAULT '' NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE user_workspace ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow user to read and write own workspace" ON user_workspace
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);