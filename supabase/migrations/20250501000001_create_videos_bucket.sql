
-- Create storage bucket for videos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'videos', 'videos', false 
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'videos');

-- Set up RLS policies for the videos bucket
CREATE POLICY "Users can read their own videos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create tiktok_webhooks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tiktok_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT,
  sandbox_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
