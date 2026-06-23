-- TAREFA 1: bloquear UPDATE de pagamento pelo cliente.
-- A policy perigosa "Service can update payments" USING(true) já foi removida na migration 20260316211441.
-- A policy atual "Authenticated can update own payments" permite que o profissional altere status/valor
-- da própria linha direto pelo cliente. Nenhum fluxo legítimo do app depende dessa UPDATE pelo cliente
-- (front só faz SELECT; refund e atualizações de pagamento vão via edge function com service_role,
-- que ignora RLS). Removemos a policy para fechar o vetor.
DROP POLICY IF EXISTS "Authenticated can update own payments" ON public.consultation_payments;

-- Sanity-net: garantir que nenhuma policy USING(true) existe nesta tabela.
DROP POLICY IF EXISTS "Service can update payments" ON public.consultation_payments;
DROP POLICY IF EXISTS "Service can insert payments" ON public.consultation_payments;