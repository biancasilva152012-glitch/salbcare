
-- Lightweight health check on the same essential tables audited in
-- audit_rls_coverage(). Returns a single row with overall_ok = false when ANY
-- essential table has RLS disabled OR no policy that scopes by auth.uid().
-- Available to any authenticated user so the admin shell can gate itself.
CREATE OR REPLACE FUNCTION public.check_rls_health()
RETURNS TABLE(
  overall_ok boolean,
  failing_tables text[],
  checked_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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
  r_scoped boolean;
  bad text[] := ARRAY[]::text[];
BEGIN
  FOREACH t IN ARRAY audited LOOP
    SELECT c.relrowsecurity
      INTO r_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = t;

    IF r_enabled IS NULL OR r_enabled = false THEN
      bad := array_append(bad, t);
      CONTINUE;
    END IF;

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

    IF NOT r_scoped THEN
      bad := array_append(bad, t);
    END IF;
  END LOOP;

  overall_ok := (array_length(bad, 1) IS NULL);
  failing_tables := bad;
  checked_at := now();
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rls_health() TO authenticated, anon;
