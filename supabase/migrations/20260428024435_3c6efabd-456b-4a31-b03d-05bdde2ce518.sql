-- Create public bucket "testimonials" for landing page testimonial photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonials', 'testimonials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access
DROP POLICY IF EXISTS "Public can read testimonials bucket" ON storage.objects;
CREATE POLICY "Public can read testimonials bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'testimonials');

-- Admin-only write/update/delete
DROP POLICY IF EXISTS "Admins can upload testimonials" ON storage.objects;
CREATE POLICY "Admins can upload testimonials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'testimonials' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update testimonials" ON storage.objects;
CREATE POLICY "Admins can update testimonials"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'testimonials' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'testimonials' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete testimonials" ON storage.objects;
CREATE POLICY "Admins can delete testimonials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'testimonials' AND has_role(auth.uid(), 'admin'::app_role));