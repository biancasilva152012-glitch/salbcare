-- Add indexes on frequently queried columns for performance

-- profiles: user_type (patient vs professional filtering)
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles (user_type);

-- profiles: user_id (used in almost every query)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);

-- appointments: common query patterns
CREATE INDEX IF NOT EXISTS idx_appointments_user_id_date ON public.appointments (user_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON public.appointments (professional_id);

-- financial_transactions: user + date range queries
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_date ON public.financial_transactions (user_id, date);

-- teleconsultations: user + status queries
CREATE INDEX IF NOT EXISTS idx_teleconsultations_user_id ON public.teleconsultations (user_id, status);

-- patients: user + name search
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients (user_id);

-- medical_records: patient lookup
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records (patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_user_id ON public.medical_records (user_id);