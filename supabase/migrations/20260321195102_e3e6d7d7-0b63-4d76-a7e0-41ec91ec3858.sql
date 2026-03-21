
-- Storage bucket for prescription images (public upload, no login)
INSERT INTO storage.buckets (id, name, public) VALUES ('prescription-uploads', 'prescription-uploads', true);

-- Allow anyone to upload to prescription-uploads
CREATE POLICY "Anyone can upload prescription images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'prescription-uploads');

-- Allow anyone to read prescription uploads
CREATE POLICY "Anyone can read prescription uploads"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'prescription-uploads');
