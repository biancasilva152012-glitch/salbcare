
-- Add signature_url, stamp_url, meet_link to professionals table
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS signature_url text,
  ADD COLUMN IF NOT EXISTS stamp_url text,
  ADD COLUMN IF NOT EXISTS meet_link text;

-- Create professional-assets storage bucket (public for PDF rendering)
INSERT INTO storage.buckets (id, name, public)
VALUES ('professional-assets', 'professional-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload to their own folder
CREATE POLICY "Users can upload own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'professional-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: public read access
CREATE POLICY "Public read access for professional assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'professional-assets');

-- Storage policy: users can update their own assets
CREATE POLICY "Users can update own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'professional-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: users can delete their own assets
CREATE POLICY "Users can delete own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'professional-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
