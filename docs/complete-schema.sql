-- ============================================================
-- SALBCARE - Complete Supabase SQL Schema
-- Generated: 2026-03-16
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'contador', 'user');

-- ============================================================
-- 2. FUNCTIONS
-- ============================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, phone, professional_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'professional_type', 'medico')
  );
  RETURN NEW;
END;
$$;

-- RBAC: Check if user has a specific role (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RBAC: Check if user is admin or contador
CREATE OR REPLACE FUNCTION public.is_admin_or_contador(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'contador')
  )
$$;

-- ============================================================
-- 3. TABLES
-- ============================================================

-- Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  professional_type text NOT NULL DEFAULT 'medico',
  crm text,
  avatar_url text,
  plan text NOT NULL DEFAULT 'basic',
  payment_status text NOT NULL DEFAULT 'none',
  trial_start_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User Roles (RBAC)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Patients
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  birth_date date,
  medical_history text,
  notes text,
  initial_anamnesis text,
  procedure_performed text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Professionals (team members)
CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  specialty text NOT NULL DEFAULT '',
  crm text,
  avatar_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Appointments
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_id uuid REFERENCES public.patients(id),
  professional_id uuid REFERENCES public.professionals(id),
  patient_name text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  appointment_type text NOT NULL DEFAULT 'presencial',
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Teleconsultations
CREATE TABLE public.teleconsultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_id uuid REFERENCES public.patients(id),
  patient_name text NOT NULL,
  date timestamptz NOT NULL,
  duration integer,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  room_name text,
  room_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Medical Records (Prontuários)
CREATE TABLE public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_id uuid REFERENCES public.patients(id),
  teleconsultation_id uuid REFERENCES public.teleconsultations(id),
  patient_name text NOT NULL,
  consultation_date timestamptz NOT NULL DEFAULT now(),
  chief_complaint text,
  history_present_illness text,
  past_medical_history text,
  family_history text,
  social_history text,
  allergies text,
  current_medications text,
  physical_exam text,
  vital_signs jsonb DEFAULT '{}'::jsonb,
  diagnosis text,
  icd_code text,
  treatment_plan text,
  prescription text,
  certificate text,
  follow_up_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Patient Documents
CREATE TABLE public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'application/pdf',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Financial Transactions
CREATE TABLE public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL,
  category text NOT NULL DEFAULT 'outros',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Invoices (Notas Fiscais)
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_name text NOT NULL,
  service text NOT NULL,
  service_code text,
  amount numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'pix',
  status text NOT NULL DEFAULT 'pending',
  cpf_cnpj text,
  iss_rate numeric,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  address_zip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CNPJ Requests
CREATE TABLE public.cnpj_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  cpf text NOT NULL,
  profession text NOT NULL,
  city text NOT NULL,
  documents text DEFAULT '',
  status text NOT NULL DEFAULT 'analysis',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Accounting Partners (marketplace)
CREATE TABLE public.accounting_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  specialty text NOT NULL DEFAULT '',
  monthly_price numeric NOT NULL,
  rating numeric NOT NULL DEFAULT 5.0,
  reviews_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Partner Hires
CREATE TABLE public.partner_hires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_id uuid NOT NULL REFERENCES public.accounting_partners(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, partner_id)
);

-- Lawyers (marketplace)
CREATE TABLE public.lawyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  consultation_price numeric NOT NULL,
  rating numeric NOT NULL DEFAULT 5.0,
  reviews_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Legal Consultations
CREATE TABLE public.legal_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lawyer_id uuid NOT NULL REFERENCES public.lawyers(id),
  date date NOT NULL,
  time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chat Messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  sender text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Auto-create profile on new auth user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teleconsultations_updated_at
  BEFORE UPDATE ON public.teleconsultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teleconsultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cnpj_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_hires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ── profiles ──
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (is_admin_or_contador(auth.uid()));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (is_admin_or_contador(auth.uid()));

-- ── user_roles ──
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (is_admin_or_contador(auth.uid()));

-- ── patients ──
CREATE POLICY "Users can view own patients" ON public.patients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patients" ON public.patients FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patients" ON public.patients FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── professionals ──
CREATE POLICY "Users can view own professionals" ON public.professionals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own professionals" ON public.professionals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own professionals" ON public.professionals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own professionals" ON public.professionals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── appointments ──
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own appointments" ON public.appointments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public can insert appointments via booking" ON public.appointments FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = appointments.user_id) AND status = 'scheduled');

-- ── teleconsultations ──
CREATE POLICY "Users can view own teleconsultations" ON public.teleconsultations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own teleconsultations" ON public.teleconsultations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own teleconsultations" ON public.teleconsultations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own teleconsultations" ON public.teleconsultations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── medical_records ──
CREATE POLICY "Users can view own medical records" ON public.medical_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medical records" ON public.medical_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medical records" ON public.medical_records FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medical records" ON public.medical_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── patient_documents ──
CREATE POLICY "Users can view own patient documents" ON public.patient_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patient documents" ON public.patient_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own patient documents" ON public.patient_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── financial_transactions ──
CREATE POLICY "Users can view own transactions" ON public.financial_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.financial_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.financial_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.financial_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── invoices ──
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── cnpj_requests ──
CREATE POLICY "Users can view own cnpj_requests" ON public.cnpj_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cnpj_requests" ON public.cnpj_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cnpj_requests" ON public.cnpj_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all cnpj_requests" ON public.cnpj_requests FOR SELECT TO authenticated USING (is_admin_or_contador(auth.uid()));
CREATE POLICY "Admins can update all cnpj_requests" ON public.cnpj_requests FOR UPDATE TO authenticated USING (is_admin_or_contador(auth.uid()));

-- ── accounting_partners ──
CREATE POLICY "Anyone can view partners" ON public.accounting_partners FOR SELECT TO authenticated USING (true);

-- ── partner_hires ──
CREATE POLICY "Users can view own hires" ON public.partner_hires FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hires" ON public.partner_hires FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own hires" ON public.partner_hires FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── lawyers ──
CREATE POLICY "Anyone can view lawyers" ON public.lawyers FOR SELECT TO authenticated USING (true);

-- ── legal_consultations ──
CREATE POLICY "Users can view own legal_consultations" ON public.legal_consultations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own legal_consultations" ON public.legal_consultations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own legal_consultations" ON public.legal_consultations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own legal_consultations" ON public.legal_consultations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── chat_messages ──
CREATE POLICY "Users can view own chat messages" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all chat messages" ON public.chat_messages FOR SELECT TO authenticated USING (is_admin_or_contador(auth.uid()));
CREATE POLICY "Admins can insert chat replies" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (is_admin_or_contador(auth.uid()));

-- ============================================================
-- 6. STORAGE BUCKETS
-- ============================================================
-- Bucket: patient-documents (private)
-- Bucket: payment-receipts (private)
-- Bucket: prescriptions (private)
--
-- Note: Storage buckets are created via Supabase Dashboard/API,
-- not via SQL. Listed here for documentation purposes.

-- ============================================================
-- 7. INDEXES (beyond primary keys)
-- ============================================================
-- profiles_user_id_key: UNIQUE on profiles(user_id)
-- user_roles_user_id_role_key: UNIQUE on user_roles(user_id, role)
-- partner_hires_user_id_partner_id_key: UNIQUE on partner_hires(user_id, partner_id)
-- All tables have primary key indexes on (id)
