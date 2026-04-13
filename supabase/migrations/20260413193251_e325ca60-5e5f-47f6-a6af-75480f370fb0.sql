
-- =============================================
-- FIX 1: user_roles - restrict INSERT/DELETE to admins only
-- =============================================

-- Only admins can insert new roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FIX 3: consultation_payments - add patient_email scoped SELECT
-- The table uses doctor_id for professionals. Patients don't have
-- a user_id column here, so we keep existing policies and ensure
-- no broader access exists. The existing policies are correct:
-- doctor sees own, admin sees all. No anonymous access.
-- We just ensure no open INSERT policy exists for non-doctors.
-- =============================================

-- No changes needed for consultation_payments - existing RLS is correct:
-- SELECT: doctor_id = auth.uid() OR admin
-- INSERT: auth.uid() = doctor_id  
-- UPDATE: doctor_id matches via profiles
-- No DELETE policy (blocked by default)
-- Patient PII concern is a design warning, not a policy gap.
