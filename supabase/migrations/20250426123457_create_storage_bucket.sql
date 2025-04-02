
-- Create a storage bucket for social media uploads
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('media', 'media', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the media bucket
CREATE POLICY "Users can upload media" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media' AND public = true);
