-- ============================================================
-- SalbScore — Histórico e Documentos
-- ============================================================

-- 1. Tabela de histórico do score
CREATE TABLE IF NOT EXISTS public.salbscore_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 1000),
  faixa text NOT NULL CHECK (faixa IN ('iniciante','desenvolvimento','estabelecido','premium','elite')),
  componentes jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- componentes esperado:
  -- {
  --   "tempo_atividade": {"score": 0-100, "peso": 15, "detalhe": "..."},
  --   "consistencia_atendimentos": {...},
  --   "volume_pacientes": {...},
  --   "recebimentos_comprovados": {...},
  --   "conformidade_regulatoria": {...},
  --   "organizacao_financeira": {...},
  --   "retencao_pacientes": {...}
  -- }
  calculado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salbscore_historico_user_calc
  ON public.salbscore_historico(user_id, calculado_em DESC);

ALTER TABLE public.salbscore_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own salbscore history"
  ON public.salbscore_historico FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own salbscore history"
  ON public.salbscore_historico FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all salbscore history"
  ON public.salbscore_historico FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Tabela de documentos emitidos
CREATE TABLE IF NOT EXISTS public.salbscore_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('comprovante_renda','certidao_atividade','selo_publico')),
  hash_code text NOT NULL UNIQUE,
  score_emissao integer NOT NULL CHECK (score_emissao >= 0 AND score_emissao <= 1000),
  faixa_emissao text NOT NULL,
  dados_documento jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- dados_documento esperado para comprovante_renda:
  -- {
  --   "nome": "...", "cpf_mascarado": "***.123.456-**",
  --   "conselho": "CRM/SP 123456",
  --   "media_mensal_6m": 12500.00,
  --   "media_mensal_12m": 11800.00,
  --   "total_atendimentos_12m": 380,
  --   "periodo_inicio": "2024-01-01", "periodo_fim": "2024-12-31"
  -- }
  file_path text,
  emitido_em timestamptz NOT NULL DEFAULT now(),
  valido_ate timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salbscore_documentos_user
  ON public.salbscore_documentos(user_id, emitido_em DESC);
CREATE INDEX IF NOT EXISTS idx_salbscore_documentos_hash
  ON public.salbscore_documentos(hash_code);

ALTER TABLE public.salbscore_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own salbscore documents"
  ON public.salbscore_documentos FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Paid users can insert own salbscore documents"
  ON public.salbscore_documentos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_active_paid_plan(auth.uid()));

CREATE POLICY "Admins can view all salbscore documents"
  ON public.salbscore_documentos FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Função pública para verificação por hash (sem login)
CREATE OR REPLACE FUNCTION public.verify_salbscore_document_by_hash(_hash text)
RETURNS TABLE(
  tipo text,
  professional_name_partial text,
  conselho text,
  score_emissao integer,
  faixa_emissao text,
  emitido_em timestamptz,
  valido_ate timestamptz,
  is_valid boolean,
  dados_publicos jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    d.tipo,
    -- nome parcial: primeiro nome + inicial do sobrenome
    CASE
      WHEN p.name IS NULL THEN ''
      WHEN position(' ' in p.name) = 0 THEN p.name
      ELSE split_part(p.name, ' ', 1) || ' ' || left(split_part(p.name, ' ', -1), 1) || '.'
    END as professional_name_partial,
    CASE
      WHEN p.council_number IS NOT NULL AND p.council_state IS NOT NULL
        THEN p.professional_type || ' ' || p.council_state || ' ' || p.council_number
      ELSE p.professional_type
    END as conselho,
    d.score_emissao,
    d.faixa_emissao,
    d.emitido_em,
    d.valido_ate,
    (d.valido_ate > now()) as is_valid,
    -- remove campos sensíveis dos dados públicos
    (d.dados_documento - 'cpf_mascarado' - 'cpf') as dados_publicos
  FROM public.salbscore_documentos d
  LEFT JOIN public.profiles p ON p.user_id = d.user_id
  WHERE d.hash_code = _hash
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_salbscore_document_by_hash(text) TO anon, authenticated;