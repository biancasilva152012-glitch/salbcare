
-- 1) consultation_payments: remove client INSERT; only service_role (webhooks/edge functions) may insert
DROP POLICY IF EXISTS "Authenticated can insert own payments" ON public.consultation_payments;

-- 2) demo_usage_counters: remove anonymous access; require authenticated user scoped by user_id
DROP POLICY IF EXISTS "Anyone can insert guest counters" ON public.demo_usage_counters;
DROP POLICY IF EXISTS "Anyone can read guest counters" ON public.demo_usage_counters;
DROP POLICY IF EXISTS "Anyone can update guest counters" ON public.demo_usage_counters;

CREATE POLICY "Users read own counters"
  ON public.demo_usage_counters
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users insert own counters"
  ON public.demo_usage_counters
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users update own counters"
  ON public.demo_usage_counters
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

REVOKE ALL ON public.demo_usage_counters FROM anon;
