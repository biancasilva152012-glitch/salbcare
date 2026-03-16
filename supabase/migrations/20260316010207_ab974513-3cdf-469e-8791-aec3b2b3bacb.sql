
-- Fix 1: Change all {public} role policies to {authenticated} on sensitive tables

-- appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
CREATE POLICY "Users can insert own appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;
CREATE POLICY "Users can delete own appointments" ON public.appointments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- patients
DROP POLICY IF EXISTS "Users can view own patients" ON public.patients;
CREATE POLICY "Users can view own patients" ON public.patients FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own patients" ON public.patients;
CREATE POLICY "Users can insert own patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own patients" ON public.patients;
CREATE POLICY "Users can update own patients" ON public.patients FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own patients" ON public.patients;
CREATE POLICY "Users can delete own patients" ON public.patients FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- financial_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.financial_transactions;
CREATE POLICY "Users can view own transactions" ON public.financial_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.financial_transactions;
CREATE POLICY "Users can insert own transactions" ON public.financial_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.financial_transactions;
CREATE POLICY "Users can update own transactions" ON public.financial_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.financial_transactions;
CREATE POLICY "Users can delete own transactions" ON public.financial_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- teleconsultations
DROP POLICY IF EXISTS "Users can view own teleconsultations" ON public.teleconsultations;
CREATE POLICY "Users can view own teleconsultations" ON public.teleconsultations FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own teleconsultations" ON public.teleconsultations;
CREATE POLICY "Users can insert own teleconsultations" ON public.teleconsultations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own teleconsultations" ON public.teleconsultations;
CREATE POLICY "Users can update own teleconsultations" ON public.teleconsultations FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own teleconsultations" ON public.teleconsultations;
CREATE POLICY "Users can delete own teleconsultations" ON public.teleconsultations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- patient_documents
DROP POLICY IF EXISTS "Users can view own patient documents" ON public.patient_documents;
CREATE POLICY "Users can view own patient documents" ON public.patient_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own patient documents" ON public.patient_documents;
CREATE POLICY "Users can insert own patient documents" ON public.patient_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own patient documents" ON public.patient_documents;
CREATE POLICY "Users can delete own patient documents" ON public.patient_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- profiles (keep insert as public for handle_new_user trigger, but fix select/update)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
