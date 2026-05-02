CREATE TABLE public.leads_demo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  dor_principal text NOT NULL,
  whatsapp text NOT NULL,
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_demo ENABLE ROW LEVEL SECURITY;

-- Insert público (qualquer pessoa pode submeter)
CREATE POLICY "Anyone can submit demo lead"
ON public.leads_demo
FOR INSERT
TO anon, authenticated
WITH CHECK (
  nome IS NOT NULL AND length(nome) > 0
  AND email IS NOT NULL AND length(email) > 0
  AND whatsapp IS NOT NULL AND length(whatsapp) > 0
  AND dor_principal IS NOT NULL AND length(dor_principal) > 0
);

-- Admin pode ver/atualizar/deletar
CREATE POLICY "Admins can view all demo leads"
ON public.leads_demo
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update demo leads"
ON public.leads_demo
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete demo leads"
ON public.leads_demo
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_leads_demo_created_at ON public.leads_demo(created_at DESC);