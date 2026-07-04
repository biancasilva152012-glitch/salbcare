
-- 1) Seed admin role for the CEO from auth.users (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'biancadealbuquerquep@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Server-side "paid plan / active trial" check (SECURITY DEFINER, fixed search_path)
CREATE OR REPLACE FUNCTION public.has_active_paid_plan(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Admins always pass
    public.has_role(_user_id, 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = _user_id
        AND (
          -- Explicit active payment
          p.payment_status = 'active'
          -- Any non-basic plan is considered paid
          OR (p.plan IS NOT NULL AND p.plan <> 'basic')
          -- Ongoing 7-day trial window
          OR (p.trial_start_date IS NOT NULL AND p.trial_start_date > now() - interval '7 days')
        )
    );
$$;

REVOKE ALL ON FUNCTION public.has_active_paid_plan(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_paid_plan(uuid) TO authenticated, service_role;

-- 3) Server-enforced freemium quotas via replacement INSERT policies.
--    Free users are capped; paid/trial/admin users are unlimited.

-- Patients: 5 rows / free user
DROP POLICY IF EXISTS "Users can insert own patients" ON public.patients;
CREATE POLICY "Users can insert own patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.has_active_paid_plan(auth.uid())
    OR (SELECT count(*) FROM public.patients WHERE user_id = auth.uid()) < 5
  )
);

-- Appointments: 5 rows / free user
DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
CREATE POLICY "Users can insert own appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.has_active_paid_plan(auth.uid())
    OR (SELECT count(*) FROM public.appointments WHERE user_id = auth.uid()) < 5
  )
);

-- Financial transactions: 10 rows per calendar month / free user
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.financial_transactions;
CREATE POLICY "Users can insert own transactions"
ON public.financial_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.has_active_paid_plan(auth.uid())
    OR (
      SELECT count(*)
      FROM public.financial_transactions
      WHERE user_id = auth.uid()
        AND date_trunc('month', coalesce(created_at, now())) = date_trunc('month', now())
    ) < 10
  )
);
