
CREATE TABLE public.partner_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  city TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  partner_type TEXT NOT NULL DEFAULT 'farmacia',
  plan_interest TEXT DEFAULT 'basico',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_interests ENABLE ROW LEVEL SECURITY;

-- Admins can view all
CREATE POLICY "Admins can view partner interests"
  ON public.partner_interests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone (including anon) can submit interest
CREATE POLICY "Anyone can submit partner interest"
  ON public.partner_interests FOR INSERT
  TO public
  WITH CHECK (
    company_name IS NOT NULL AND
    length(company_name) > 0 AND
    email IS NOT NULL AND
    length(email) > 0
  );
