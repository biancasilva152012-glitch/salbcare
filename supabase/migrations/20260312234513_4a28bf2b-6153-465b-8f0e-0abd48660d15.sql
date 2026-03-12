
-- Create patient_documents table
CREATE TABLE public.patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patient documents" ON public.patient_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patient documents" ON public.patient_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own patient documents" ON public.patient_documents FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-documents', 'patient-documents', false);

-- Storage RLS policies
CREATE POLICY "Users can upload patient docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own patient docs" ON storage.objects FOR SELECT USING (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own patient docs" ON storage.objects FOR DELETE USING (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
