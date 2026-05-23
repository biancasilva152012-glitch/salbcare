
-- 1. Audit log table for LGPD/CFM compliance
CREATE TABLE IF NOT EXISTS public.pii_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  action text NOT NULL CHECK (action IN ('view','create','update','delete')),
  resource_table text NOT NULL,
  resource_id uuid,
  patient_id uuid,
  patient_name text,
  reason text,
  ip_address text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pii_access_log_actor ON public.pii_access_log(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pii_access_log_patient ON public.pii_access_log(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pii_access_log_table ON public.pii_access_log(resource_table, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pii_access_log_created ON public.pii_access_log(created_at DESC);

ALTER TABLE public.pii_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all access logs"
ON public.pii_access_log FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own access logs"
ON public.pii_access_log FOR SELECT
TO authenticated
USING (actor_user_id = auth.uid());

CREATE POLICY "Authenticated can insert own access log"
ON public.pii_access_log FOR INSERT
TO authenticated
WITH CHECK (actor_user_id = auth.uid());

-- 2. Trigger-side audit function
CREATE OR REPLACE FUNCTION public.log_pii_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_pid uuid;
  v_pname text;
  v_owner uuid;
  v_rid uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN v_action := 'create';
  ELSIF TG_OP = 'UPDATE' THEN v_action := 'update';
  ELSIF TG_OP = 'DELETE' THEN v_action := 'delete';
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_owner := OLD.user_id;
    v_rid := OLD.id;
  ELSE
    v_owner := NEW.user_id;
    v_rid := NEW.id;
  END IF;

  -- patient id/name extraction per table
  IF TG_TABLE_NAME = 'patients' THEN
    v_pid := v_rid;
    v_pname := CASE WHEN TG_OP = 'DELETE' THEN OLD.name ELSE NEW.name END;
  ELSIF TG_TABLE_NAME IN ('medical_records','digital_documents','appointments') THEN
    v_pid := CASE WHEN TG_OP = 'DELETE' THEN OLD.patient_id ELSE NEW.patient_id END;
    v_pname := CASE WHEN TG_OP = 'DELETE' THEN OLD.patient_name ELSE NEW.patient_name END;
  ELSIF TG_TABLE_NAME = 'patient_documents' THEN
    v_pid := CASE WHEN TG_OP = 'DELETE' THEN OLD.patient_id ELSE NEW.patient_id END;
  END IF;

  INSERT INTO public.pii_access_log(
    actor_user_id, action, resource_table, resource_id, patient_id, patient_name, metadata
  ) VALUES (
    COALESCE(auth.uid(), v_owner),
    v_action,
    TG_TABLE_NAME,
    v_rid,
    v_pid,
    v_pname,
    jsonb_build_object('owner_user_id', v_owner)
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_pii_change() FROM PUBLIC, anon, authenticated;

-- 3. Attach triggers to PII tables
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['patients','medical_records','digital_documents','patient_documents','appointments']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_pii_change()', t, t);
  END LOOP;
END $$;

-- 4. Client-callable view-logging RPC (so SELECTs from UI can be logged)
CREATE OR REPLACE FUNCTION public.log_pii_view(
  _resource_table text,
  _resource_id uuid,
  _patient_id uuid DEFAULT NULL,
  _patient_name text DEFAULT NULL,
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  IF _resource_table !~ '^[a-z_]+$' OR length(_resource_table) > 64 THEN
    RAISE EXCEPTION 'invalid resource_table';
  END IF;
  INSERT INTO public.pii_access_log(
    actor_user_id, action, resource_table, resource_id, patient_id, patient_name, reason
  ) VALUES (
    auth.uid(), 'view', _resource_table, _resource_id, _patient_id, _patient_name,
    NULLIF(left(COALESCE(_reason,''), 200), '')
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_pii_view(text, uuid, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_pii_view(text, uuid, uuid, text, text) TO authenticated;

-- 5. Admin RPC to read logs with filters
CREATE OR REPLACE FUNCTION public.get_pii_access_logs(
  _limit int DEFAULT 200,
  _actor uuid DEFAULT NULL,
  _patient uuid DEFAULT NULL,
  _table text DEFAULT NULL
)
RETURNS TABLE(
  id uuid, actor_user_id uuid, actor_email text, action text,
  resource_table text, resource_id uuid, patient_id uuid, patient_name text,
  reason text, ip_address text, created_at timestamptz
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
  RETURN QUERY
  SELECT l.id, l.actor_user_id,
         COALESCE(l.actor_email, p.email),
         l.action, l.resource_table, l.resource_id,
         l.patient_id, l.patient_name, l.reason, l.ip_address, l.created_at
  FROM public.pii_access_log l
  LEFT JOIN public.profiles p ON p.user_id = l.actor_user_id
  WHERE (_actor IS NULL OR l.actor_user_id = _actor)
    AND (_patient IS NULL OR l.patient_id = _patient)
    AND (_table IS NULL OR l.resource_table = _table)
  ORDER BY l.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 1000));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_pii_access_logs(int, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pii_access_logs(int, uuid, uuid, text) TO authenticated;

-- 6. Fix ambassador_waitlist: only allow own email
DROP POLICY IF EXISTS "Authenticated can join waitlist" ON public.ambassador_waitlist;
CREATE POLICY "Authenticated can join waitlist with own email"
ON public.ambassador_waitlist FOR INSERT
TO authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) > 0
  AND lower(email) = lower(COALESCE(
    (SELECT pr.email FROM public.profiles pr WHERE pr.user_id = auth.uid() LIMIT 1),
    ''
  ))
);
