
-- Medical records (prontuário) table
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  teleconsultation_id UUID REFERENCES public.teleconsultations(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  
  -- Anamnese
  chief_complaint TEXT,
  history_present_illness TEXT,
  past_medical_history TEXT,
  family_history TEXT,
  social_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  
  -- Exame físico
  physical_exam TEXT,
  vital_signs JSONB DEFAULT '{}'::jsonb,
  
  -- Diagnóstico e conduta
  diagnosis TEXT,
  icd_code TEXT,
  treatment_plan TEXT,
  prescription TEXT,
  certificate TEXT,
  follow_up_notes TEXT,
  
  -- Metadata
  consultation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own medical records"
  ON public.medical_records FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical records"
  ON public.medical_records FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical records"
  ON public.medical_records FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical records"
  ON public.medical_records FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
