
-- Table for service requests (pronto-atendimento flow, no login required)
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'prescription_renewal',
  status TEXT NOT NULL DEFAULT 'pending_payment',
  patient_name TEXT,
  patient_cpf TEXT,
  patient_birth_date DATE,
  patient_email TEXT,
  patient_phone TEXT,
  patient_address TEXT,
  patient_data JSONB DEFAULT '{}'::jsonb,
  prescription_data JSONB DEFAULT '{}'::jsonb,
  prescription_image_path TEXT,
  receipt_url TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  consultation_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Public can insert (no login needed)
CREATE POLICY "Anyone can create service requests"
ON public.service_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Public can view their own by id (for tracking)
CREATE POLICY "Anyone can view service request by id"
ON public.service_requests FOR SELECT
TO anon, authenticated
USING (true);

-- Professionals can update requests assigned to them
CREATE POLICY "Professionals can update their service requests"
ON public.service_requests FOR UPDATE
TO authenticated
USING (professional_id IN (
  SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
