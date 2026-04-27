-- RPC pública para o Selo Verificado /verificado/{slug}
-- Retorna o último SalbScore + dados públicos do profissional pelo slug
CREATE OR REPLACE FUNCTION public.get_public_salbscore_by_slug(_slug text)
RETURNS TABLE(
  professional_name text,
  professional_type text,
  council_number text,
  council_state text,
  bio text,
  avatar_url text,
  profile_slug text,
  score integer,
  faixa text,
  calculado_em timestamp with time zone,
  meses_ativo integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.name,
    p.professional_type,
    p.council_number,
    p.council_state,
    p.bio,
    p.avatar_url,
    p.profile_slug,
    h.score,
    h.faixa,
    h.calculado_em,
    GREATEST(1, EXTRACT(EPOCH FROM (now() - p.created_at))::integer / (60*60*24*30))::integer as meses_ativo
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT score, faixa, calculado_em
    FROM public.salbscore_historico
    WHERE user_id = p.user_id
    ORDER BY calculado_em DESC
    LIMIT 1
  ) h ON true
  WHERE p.profile_slug = _slug
    AND p.user_type = 'professional'
    -- Mesmas regras de curadoria do diretório público
    AND p.name NOT ILIKE '%teste%'
    AND p.name NOT ILIKE '%demo%'
    AND p.email NOT ILIKE '%teste@%'
    AND p.email NOT ILIKE '%demo%'
    AND (
      p.directory_grandfathered = true
      OR p.payment_status IN ('active', 'trialing', 'paid')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.user_id AND ur.role = 'admin'
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_salbscore_by_slug(text) TO anon, authenticated;