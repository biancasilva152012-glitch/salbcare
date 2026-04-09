
-- Table: diagnosticos (financial diagnostic leads)
CREATE TABLE public.diagnosticos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  especialidade TEXT NOT NULL,
  regime_atual TEXT NOT NULL,
  faturamento TEXT NOT NULL,
  resultado_gerado JSONB NOT NULL DEFAULT '{}'::jsonb,
  aceita_dicas BOOLEAN NOT NULL DEFAULT false,
  converteu_para_trial BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit diagnostic"
ON public.diagnosticos FOR INSERT
TO anon, authenticated
WITH CHECK (
  nome IS NOT NULL AND length(nome) > 0
  AND whatsapp IS NOT NULL AND length(whatsapp) > 0
  AND email IS NOT NULL AND length(email) > 0
);

CREATE POLICY "Admins can view all diagnostics"
ON public.diagnosticos FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: leads_b2b (pharmacy/lab partner leads)
CREATE TABLE public.leads_b2b (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'farmacia',
  nome_empresa TEXT NOT NULL,
  cnpj TEXT,
  cidade TEXT NOT NULL,
  estado TEXT,
  nome_responsavel TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  quantidade_unidades TEXT NOT NULL DEFAULT '1',
  status TEXT NOT NULL DEFAULT 'novo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_b2b ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit b2b lead"
ON public.leads_b2b FOR INSERT
TO anon, authenticated
WITH CHECK (
  nome_empresa IS NOT NULL AND length(nome_empresa) > 0
  AND email IS NOT NULL AND length(email) > 0
);

CREATE POLICY "Admins can view all b2b leads"
ON public.leads_b2b FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update b2b leads"
ON public.leads_b2b FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
