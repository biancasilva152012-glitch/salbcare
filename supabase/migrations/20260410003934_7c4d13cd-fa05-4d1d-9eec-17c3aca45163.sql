
-- 1. Fix digital_documents: replace overly permissive anon SELECT with hash-based lookup
DROP POLICY IF EXISTS "Anyone can verify documents by hash" ON public.digital_documents;
CREATE POLICY "Anyone can verify documents by hash"
  ON public.digital_documents
  FOR SELECT
  TO anon
  USING (false); -- Anon cannot browse; verification is done via RPC function below

-- Create a secure function for hash-based document verification
CREATE OR REPLACE FUNCTION public.verify_document_by_hash(_hash text)
RETURNS TABLE (
  document_type text,
  patient_name text,
  professional_name text,
  professional_type text,
  council_number text,
  council_state text,
  signed_icp boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.document_type,
    d.patient_name,
    d.professional_name,
    d.professional_type,
    d.council_number,
    d.council_state,
    d.signed_icp,
    d.created_at
  FROM public.digital_documents d
  WHERE d.hash_code = _hash
  LIMIT 1;
$$;

-- 2. Fix booking-receipts storage: remove anon policies
DROP POLICY IF EXISTS "Anyone can upload booking receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view booking receipts" ON storage.objects;

CREATE POLICY "Authenticated can upload booking receipts"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'booking-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own booking receipts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'booking-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Fix prescription-uploads: remove anon policies, restrict to authenticated
DROP POLICY IF EXISTS "Anyone can read prescription uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload prescription images" ON storage.objects;

UPDATE storage.buckets SET public = false WHERE id = 'prescription-uploads';

CREATE POLICY "Authenticated can upload prescription images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'prescription-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own prescription uploads"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'prescription-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Fix service_requests INSERT: require ownership
DROP POLICY IF EXISTS "Authenticated can create service requests" ON public.service_requests;
CREATE POLICY "Authenticated can create own service requests"
  ON public.service_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = professional_id);

-- 5. Fix appointments INSERT: the duplicate permissive policy without ownership
DROP POLICY IF EXISTS "Authenticated can book appointments" ON public.appointments;

-- 6. Add DELETE policy for prescriptions bucket
CREATE POLICY "Users can delete own prescriptions"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'prescriptions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 7. Fix patient-documents storage: change from public to authenticated
DROP POLICY IF EXISTS "Users can upload patient docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own patient docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own patient docs" ON storage.objects;

CREATE POLICY "Users can upload patient docs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own patient docs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own patient docs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
