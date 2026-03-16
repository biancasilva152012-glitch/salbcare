
CREATE TABLE public.consultation_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  patient_name text NOT NULL,
  patient_email text,
  patient_phone text,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  gross_amount numeric NOT NULL,
  platform_fee numeric NOT NULL,
  net_amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'card',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_payments ENABLE ROW LEVEL SECURITY;

-- Professionals can view their own payments
CREATE POLICY "Professionals can view own payments"
  ON public.consultation_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.consultation_payments FOR SELECT
  TO authenticated
  USING (is_admin_or_contador(auth.uid()));

-- Service role inserts (via edge functions)
CREATE POLICY "Service can insert payments"
  ON public.consultation_payments FOR INSERT
  TO public
  WITH CHECK (true);

-- Service role updates
CREATE POLICY "Service can update payments"
  ON public.consultation_payments FOR UPDATE
  TO public
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_consultation_payments_updated_at
  BEFORE UPDATE ON public.consultation_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
