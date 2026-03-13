-- Create prescriptions storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false);

-- RLS: Users can upload their own prescriptions
CREATE POLICY "Users can upload own prescriptions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can view their own prescriptions
CREATE POLICY "Users can view own prescriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Admins can view all prescriptions
CREATE POLICY "Admins can view all prescriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'prescriptions' AND public.is_admin_or_contador(auth.uid()));
