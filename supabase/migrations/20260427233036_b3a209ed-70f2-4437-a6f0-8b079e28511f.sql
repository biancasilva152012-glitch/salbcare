DROP POLICY IF EXISTS "Users can insert own salbscore history" ON public.salbscore_historico;

CREATE OR REPLACE FUNCTION public.check_salbscore_security_health()
RETURNS TABLE(
  check_key text,
  label text,
  status text,
  message text,
  action_hint text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  hist_rls boolean;
  docs_rls boolean;
  hist_user_select boolean;
  hist_user_insert boolean;
  hist_public_write boolean;
  docs_user_select boolean;
  docs_user_insert_paid boolean;
  docs_public_write boolean;
  public_rpc boolean;
BEGIN
  SELECT c.relrowsecurity INTO hist_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'salbscore_historico';

  SELECT c.relrowsecurity INTO docs_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'salbscore_documentos';

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'salbscore_historico'
      AND cmd IN ('SELECT', 'ALL')
      AND qual ILIKE '%auth.uid() = user_id%'
  ) INTO hist_user_select;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'salbscore_historico'
      AND cmd IN ('INSERT', 'ALL')
      AND roles && ARRAY['authenticated']::name[]
  ) INTO hist_user_insert;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'salbscore_historico'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      AND roles && ARRAY['anon', 'public']::name[]
  ) INTO hist_public_write;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'salbscore_documentos'
      AND cmd IN ('SELECT', 'ALL')
      AND qual ILIKE '%auth.uid() = user_id%'
  ) INTO docs_user_select;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'salbscore_documentos'
      AND cmd IN ('INSERT', 'ALL')
      AND with_check ILIKE '%has_active_paid_plan%'
  ) INTO docs_user_insert_paid;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'salbscore_documentos'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      AND roles && ARRAY['anon', 'public']::name[]
  ) INTO docs_public_write;

  SELECT has_function_privilege('anon', 'public.get_public_salbscore_by_slug(text)', 'EXECUTE')
  INTO public_rpc;

  check_key := 'route_private_salbscore';
  label := 'Rota /perfil/salbscore protegida';
  status := 'ok';
  message := 'Deve exigir login, mas não deve exigir plano pago no roteador.';
  action_hint := 'Se redirecionar usuário logado para login, revisar ProfessionalRoute/AuthProvider.';
  RETURN NEXT;

  check_key := 'route_public_seal';
  label := 'Rota /verificado/:slug pública e somente leitura';
  status := CASE WHEN public_rpc THEN 'ok' ELSE 'fail' END;
  message := CASE WHEN public_rpc THEN 'A rota usa consulta pública controlada para exibir apenas dados permitidos.' ELSE 'A consulta pública do selo não está disponível.' END;
  action_hint := CASE WHEN public_rpc THEN 'Nenhuma ação necessária.' ELSE 'Recriar permissão da função pública do selo.' END;
  RETURN NEXT;

  check_key := 'rls_history_read';
  label := 'Histórico SalbScore com leitura isolada';
  status := CASE WHEN COALESCE(hist_rls, false) AND hist_user_select THEN 'ok' ELSE 'fail' END;
  message := CASE WHEN COALESCE(hist_rls, false) AND hist_user_select THEN 'Usuários leem somente o próprio histórico.' ELSE 'RLS/leitura por usuário não está configurada corretamente.' END;
  action_hint := CASE WHEN COALESCE(hist_rls, false) AND hist_user_select THEN 'Nenhuma ação necessária.' ELSE 'Ativar RLS e política de leitura por usuário.' END;
  RETURN NEXT;

  check_key := 'rls_history_write';
  label := 'Histórico SalbScore bloqueia escrita direta';
  status := CASE WHEN NOT hist_user_insert AND NOT hist_public_write THEN 'ok' ELSE 'fail' END;
  message := CASE WHEN NOT hist_user_insert AND NOT hist_public_write THEN 'Nenhum visitante ou usuário autenticado consegue gravar histórico direto pela UI.' ELSE 'Existe permissão direta de escrita no histórico.' END;
  action_hint := CASE WHEN NOT hist_user_insert AND NOT hist_public_write THEN 'Histórico deve continuar sendo gerado apenas pelo backend.' ELSE 'Remover políticas de escrita direta em salbscore_historico.' END;
  RETURN NEXT;

  check_key := 'rls_documents_read';
  label := 'Documentos SalbScore com leitura isolada';
  status := CASE WHEN COALESCE(docs_rls, false) AND docs_user_select THEN 'ok' ELSE 'fail' END;
  message := CASE WHEN COALESCE(docs_rls, false) AND docs_user_select THEN 'Usuários leem somente seus próprios documentos emitidos.' ELSE 'RLS/leitura dos documentos não está configurada corretamente.' END;
  action_hint := CASE WHEN COALESCE(docs_rls, false) AND docs_user_select THEN 'Nenhuma ação necessária.' ELSE 'Ativar RLS e política de leitura por usuário.' END;
  RETURN NEXT;

  check_key := 'rls_documents_write';
  label := 'Emissão de documento restrita ao plano ativo';
  status := CASE WHEN COALESCE(docs_rls, false) AND docs_user_insert_paid AND NOT docs_public_write THEN 'ok' ELSE 'fail' END;
  message := CASE WHEN COALESCE(docs_rls, false) AND docs_user_insert_paid AND NOT docs_public_write THEN 'Somente contas autorizadas podem emitir documentos; visitantes não escrevem.' ELSE 'A regra de emissão pode estar permissiva demais.' END;
  action_hint := CASE WHEN COALESCE(docs_rls, false) AND docs_user_insert_paid AND NOT docs_public_write THEN 'Nenhuma ação necessária.' ELSE 'Revisar política de emissão dos documentos SalbScore.' END;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_salbscore_security_health() TO authenticated;