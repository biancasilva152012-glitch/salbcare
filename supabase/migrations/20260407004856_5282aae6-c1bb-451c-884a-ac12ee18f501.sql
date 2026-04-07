
-- B2B Prospects CRM table
CREATE TABLE public.b2b_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  partner_type text NOT NULL DEFAULT 'farmacia',
  contact_name text NOT NULL,
  email text,
  phone text,
  city text,
  state text,
  cnpj text,
  pipeline_stage text NOT NULL DEFAULT 'lead',
  notes text,
  next_action_date date,
  assigned_to text,
  whatsapp_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.b2b_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on b2b_prospects" ON public.b2b_prospects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin logs table
CREATE TABLE public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_table text,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_logs" ON public.admin_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
