
-- Audit function: verifies RLS + per-user policies on the tables that back
-- the Patients / Agenda / Financial screens (and their dependents).
-- Only admins (via has_role) may execute it.
CREATE OR REPLACE FUNCTION public.audit_rls_coverage()
RETURNS TABLE(
  table_name text,
  rls_enabled boolean,
  has_select boolean,
  has_insert boolean,
  has_update boolean,
  has_delete boolean,
  user_scoped boolean,
  status text,
  notes text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  audited text[] := ARRAY[
    'patients',
    'appointments',
    'financial_transactions',
    'medical_records',
    'invoices',
    'teleconsultations',
    'digital_documents',
    'patient_documents'
  ];
  t text;
  r_enabled boolean;
  r_select boolean;
  r_insert boolean;
  r_update boolean;
  r_delete boolean;
  r_scoped boolean;
  r_status text;
  r_notes text;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  FOREACH t IN ARRAY audited LOOP
    -- RLS enabled?
    SELECT c.relrowsecurity
      INTO r_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = t;

    IF r_enabled IS NULL THEN
      table_name := t;
      rls_enabled := false;
      has_select := false; has_insert := false; has_update := false; has_delete := false;
      user_scoped := false;
      status := 'fail';
      notes := 'tabela não encontrada em public';
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Per-command policies present?
    SELECT
      bool_or(cmd = 'SELECT' OR cmd = 'ALL'),
      bool_or(cmd = 'INSERT' OR cmd = 'ALL'),
      bool_or(cmd = 'UPDATE' OR cmd = 'ALL'),
      bool_or(cmd = 'DELETE' OR cmd = 'ALL')
      INTO r_select, r_insert, r_update, r_delete
      FROM pg_policies
     WHERE schemaname = 'public' AND tablename = t;

    r_select := COALESCE(r_select, false);
    r_insert := COALESCE(r_insert, false);
    r_update := COALESCE(r_update, false);
    r_delete := COALESCE(r_delete, false);

    -- Does at least one policy enforce auth.uid() = user_id (or doctor_id for
    -- consultation_payments / professional_id for service_requests etc.)?
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = t
         AND (
           qual ILIKE '%auth.uid() = user_id%'
           OR with_check ILIKE '%auth.uid() = user_id%'
           OR qual ILIKE '%user_id = auth.uid()%'
           OR with_check ILIKE '%user_id = auth.uid()%'
         )
    ) INTO r_scoped;

    -- Aggregate status
    IF NOT r_enabled THEN
      r_status := 'fail';
      r_notes := 'RLS desativado — qualquer usuário pode ler/gravar';
    ELSIF NOT r_scoped THEN
      r_status := 'fail';
      r_notes := 'RLS ativo mas nenhuma policy filtra por auth.uid() = user_id';
    ELSIF NOT (r_select AND r_insert AND r_update AND r_delete) THEN
      r_status := 'warning';
      r_notes := 'faltam policies para alguns comandos (select/insert/update/delete)';
    ELSE
      r_status := 'ok';
      r_notes := 'RLS ativo e isolado por usuário';
    END IF;

    table_name := t;
    rls_enabled := r_enabled;
    has_select := r_select;
    has_insert := r_insert;
    has_update := r_update;
    has_delete := r_delete;
    user_scoped := r_scoped;
    status := r_status;
    notes := r_notes;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_rls_coverage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.audit_rls_coverage() TO authenticated;
