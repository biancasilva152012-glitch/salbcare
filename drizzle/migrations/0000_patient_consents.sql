CREATE TABLE public.patient_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  patient_cpf text,
  procedure_name text NOT NULL,
  content text NOT NULL,
  professional_name text NOT NULL,
  council text,
  signature_data text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.patient_consents TO authenticated;
GRANT ALL ON public.patient_consents TO service_role;
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own consents select" ON public.patient_consents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own consents insert" ON public.patient_consents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid()));
CREATE POLICY "own consents delete" ON public.patient_consents FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX ON public.patient_consents(patient_id);