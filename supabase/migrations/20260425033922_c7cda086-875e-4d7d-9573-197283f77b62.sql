
CREATE OR REPLACE FUNCTION public.get_rls_policies_for_table(_table text)
RETURNS TABLE(
  policy_name text,
  command text,
  permissive text,
  roles text[],
  using_expr text,
  with_check_expr text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  -- Whitelist: only the tables already audited by audit_rls_coverage().
  IF _table NOT IN (
    'patients','appointments','financial_transactions','medical_records',
    'invoices','teleconsultations','digital_documents','patient_documents'
  ) THEN
    RAISE EXCEPTION 'table not allowed: %', _table;
  END IF;

  RETURN QUERY
  SELECT
    p.policyname::text,
    p.cmd::text,
    p.permissive::text,
    p.roles::text[],
    COALESCE(p.qual, '')::text,
    COALESCE(p.with_check, '')::text
  FROM pg_policies p
  WHERE p.schemaname = 'public' AND p.tablename = _table
  ORDER BY p.cmd, p.policyname;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_rls_policies_for_table(text) TO authenticated;
