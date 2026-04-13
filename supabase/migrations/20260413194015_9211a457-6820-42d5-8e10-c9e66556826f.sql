
-- 1. Remove anon SELECT policy on profiles that exposes sensitive data
DROP POLICY IF EXISTS "Anon can view professional profiles by slug" ON public.profiles;

-- 2. Users can read their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. DELETE policies for storage buckets
CREATE POLICY "Users can delete own payment receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own booking receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'booking-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own prescription uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'prescription-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
