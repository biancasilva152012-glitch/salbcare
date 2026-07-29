ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS preferred_language text;

ALTER TABLE public.pro_appointments
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;

ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS pro_appointment_id uuid REFERENCES public.pro_appointments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pro_appointments_patient_id ON public.pro_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_pro_appointment_id ON public.financial_transactions(pro_appointment_id);