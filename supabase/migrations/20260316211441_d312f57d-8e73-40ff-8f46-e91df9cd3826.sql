
-- Fix overly permissive RLS policies
DROP POLICY "Service can insert payments" ON public.consultation_payments;
DROP POLICY "Service can update payments" ON public.consultation_payments;

-- Only service_role can insert/update (edge functions use service role key)
CREATE POLICY "Authenticated can insert own payments"
  ON public.consultation_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Authenticated can update own payments"
  ON public.consultation_payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id);
