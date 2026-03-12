
-- CNPJ opening requests
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

ALTER TABLE public.cnpj_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cnpj_requests" ON public.cnpj_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cnpj_requests" ON public.cnpj_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cnpj_requests" ON public.cnpj_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Invoices
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_name text NOT NULL,
  service text NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'pix',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Accounting partners
CREATE TABLE public.accounting_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  specialty text NOT NULL DEFAULT '',
  monthly_price numeric NOT NULL,
  rating numeric NOT NULL DEFAULT 5.0,
  reviews_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.accounting_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view partners" ON public.accounting_partners FOR SELECT TO authenticated USING (true);

-- Partner hires
CREATE TABLE public.partner_hires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_id uuid NOT NULL REFERENCES public.accounting_partners(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

ALTER TABLE public.partner_hires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own hires" ON public.partner_hires FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hires" ON public.partner_hires FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own hires" ON public.partner_hires FOR DELETE TO authenticated USING (auth.uid() = user_id);
