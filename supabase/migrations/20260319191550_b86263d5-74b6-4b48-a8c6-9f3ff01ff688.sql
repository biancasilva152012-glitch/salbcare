-- Table to store digital document metadata for verification
CREATE TABLE public.digital_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_name text NOT NULL,
  patient_id uuid REFERENCES public.patients(id),
  document_type text NOT NULL DEFAULT 'prescription',
  hash_code text NOT NULL UNIQUE,
  professional_name text NOT NULL,
  professional_type text NOT NULL DEFAULT 'medico',
  council_number text,
  council_state text,
  signed_icp boolean NOT NULL DEFAULT false,
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.digital_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON public.digital_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.digital_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can verify documents by hash"
  ON public.digital_documents FOR SELECT TO anon
  USING (true);
