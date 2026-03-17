
-- Add meet_link to profiles for the professional's default Google Meet link
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS meet_link text;

-- Add index for performance on teleconsultations patient lookups
CREATE INDEX IF NOT EXISTS idx_teleconsultations_patient_id ON public.teleconsultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments(date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id_status ON public.appointments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_date ON public.financial_transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_teleconsultations_user_status ON public.teleconsultations(user_id, status);
