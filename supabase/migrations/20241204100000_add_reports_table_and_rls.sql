-- Create the reports table
CREATE TABLE public.reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_type text NOT NULL, -- 'video', 'chat', 'username', 'post'
    content_id text, -- ID of the specific content (e.g., chat_message_id, feed_item_id)
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'actioned'
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Set up RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to insert reports
CREATE POLICY "Allow authenticated users to insert reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Ensure the table is visible to the service role for moderation review
GRANT ALL ON public.reports TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO service_role;
GRANT SELECT ON public.reports TO authenticated;