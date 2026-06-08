
CREATE POLICY "Users can update own booking receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'booking-receipts' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'booking-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own prescription uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'prescription-uploads' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'prescription-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
