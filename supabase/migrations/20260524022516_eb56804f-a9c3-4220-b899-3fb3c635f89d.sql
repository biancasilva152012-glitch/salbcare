-- =========================================================
-- 1. Audit log immutability (hash chain + write-block)
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.pii_access_log
  ADD COLUMN IF NOT EXISTS prev_hash text,
  ADD COLUMN IF NOT EXISTS row_hash text;

CREATE OR REPLACE FUNCTION public.pii_access_log_sign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev text;
  v_payload text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('pii_access_log_chain'));
  SELECT row_hash INTO v_prev
    FROM public.pii_access_log
    WHERE row_hash IS NOT NULL
    ORDER BY created_at DESC, id DESC
    LIMIT 1;
  v_prev := COALESCE(v_prev, 'GENESIS');

  IF NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;

  v_payload :=
       COALESCE(NEW.id::text,'')
    || '|' || COALESCE(NEW.actor_user_id::text,'')
    || '|' || COALESCE(NEW.action,'')
    || '|' || COALESCE(NEW.resource_table,'')
    || '|' || COALESCE(NEW.resource_id::text,'')
    || '|' || COALESCE(NEW.patient_id::text,'')
    || '|' || COALESCE(NEW.patient_name,'')
    || '|' || COALESCE(NEW.reason,'')
    || '|' || COALESCE(NEW.metadata::text,'{}')
    || '|' || COALESCE(NEW.created_at::text,'');

  NEW.prev_hash := v_prev;
  NEW.row_hash  := encode(digest(v_prev || '|' || v_payload, 'sha256'), 'hex');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pii_access_log_sign ON public.pii_access_log;
CREATE TRIGGER trg_pii_access_log_sign
BEFORE INSERT ON public.pii_access_log
FOR EACH ROW EXECUTE FUNCTION public.pii_access_log_sign();

-- Block UPDATE always; block DELETE unless retention purge is running
CREATE OR REPLACE FUNCTION public.pii_access_log_block_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'pii_access_log is append-only (LGPD/CFM immutable trail)';
END $$;

CREATE OR REPLACE FUNCTION public.pii_access_log_block_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('app.allow_pii_purge', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'pii_access_log is append-only (LGPD/CFM immutable trail)';
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS trg_pii_access_log_no_update ON public.pii_access_log;
CREATE TRIGGER trg_pii_access_log_no_update
BEFORE UPDATE ON public.pii_access_log
FOR EACH ROW EXECUTE FUNCTION public.pii_access_log_block_update();

DROP TRIGGER IF EXISTS trg_pii_access_log_no_delete ON public.pii_access_log;
CREATE TRIGGER trg_pii_access_log_no_delete
BEFORE DELETE ON public.pii_access_log
FOR EACH ROW EXECUTE FUNCTION public.pii_access_log_block_delete();

-- =========================================================
-- 2. Retention purge + chain verification
-- =========================================================
CREATE OR REPLACE FUNCTION public.purge_pii_access_log(_retention_days integer DEFAULT 1825)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer := 0;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;
  IF _retention_days < 30 THEN
    RAISE EXCEPTION 'retention_days must be >= 30';
  END IF;

  PERFORM set_config('app.allow_pii_purge', 'on', true);
  WITH d AS (
    DELETE FROM public.pii_access_log
     WHERE created_at < now() - make_interval(days => _retention_days)
     RETURNING 1
  )
  SELECT count(*) INTO n FROM d;
  PERFORM set_config('app.allow_pii_purge', 'off', true);

  INSERT INTO public.pii_access_log(actor_user_id, action, resource_table, reason, metadata)
  VALUES (auth.uid(), 'delete', 'pii_access_log', 'retention purge',
          jsonb_build_object('purged_count', n, 'retention_days', _retention_days));

  RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.purge_pii_access_log(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_pii_access_log(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_pii_access_log_chain(_limit integer DEFAULT 10000)
RETURNS TABLE(ok boolean, total bigint, first_invalid_id uuid, first_invalid_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  expected text;
  prev text := 'GENESIS';
  cnt bigint := 0;
  bad_id uuid;
  bad_at timestamptz;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;
  FOR r IN
    SELECT * FROM public.pii_access_log
     WHERE row_hash IS NOT NULL
     ORDER BY created_at ASC, id ASC
     LIMIT _limit
  LOOP
    cnt := cnt + 1;
    expected := encode(digest(
      prev || '|' ||
      COALESCE(r.id::text,'') || '|' || COALESCE(r.actor_user_id::text,'') || '|' ||
      COALESCE(r.action,'') || '|' || COALESCE(r.resource_table,'') || '|' ||
      COALESCE(r.resource_id::text,'') || '|' || COALESCE(r.patient_id::text,'') || '|' ||
      COALESCE(r.patient_name,'') || '|' || COALESCE(r.reason,'') || '|' ||
      COALESCE(r.metadata::text,'{}') || '|' || COALESCE(r.created_at::text,''),
      'sha256'), 'hex');
    IF r.row_hash IS DISTINCT FROM expected OR COALESCE(r.prev_hash,'GENESIS') IS DISTINCT FROM prev THEN
      bad_id := r.id;
      bad_at := r.created_at;
      EXIT;
    END IF;
    prev := r.row_hash;
  END LOOP;
  RETURN QUERY SELECT (bad_id IS NULL), cnt, bad_id, bad_at;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.verify_pii_access_log_chain(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_pii_access_log_chain(integer) TO authenticated;

-- =========================================================
-- 3. Advanced filters on get_pii_access_logs
-- =========================================================
DROP FUNCTION IF EXISTS public.get_pii_access_logs(integer, uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.get_pii_access_logs(
  _limit integer DEFAULT 200,
  _actor uuid DEFAULT NULL,
  _patient uuid DEFAULT NULL,
  _table text DEFAULT NULL,
  _action text DEFAULT NULL,
  _from timestamptz DEFAULT NULL,
  _to timestamptz DEFAULT NULL,
  _actor_email text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  actor_user_id uuid,
  actor_email text,
  actor_status text,
  action text,
  resource_table text,
  resource_id uuid,
  patient_id uuid,
  patient_name text,
  reason text,
  ip_address text,
  created_at timestamptz,
  prev_hash text,
  row_hash text
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
  SELECT
    l.id,
    l.actor_user_id,
    COALESCE(l.actor_email, p.email),
    p.payment_status,
    l.action,
    l.resource_table,
    l.resource_id,
    l.patient_id,
    l.patient_name,
    l.reason,
    l.ip_address,
    l.created_at,
    l.prev_hash,
    l.row_hash
  FROM public.pii_access_log l
  LEFT JOIN public.profiles p ON p.user_id = l.actor_user_id
  WHERE (_actor IS NULL OR l.actor_user_id = _actor)
    AND (_patient IS NULL OR l.patient_id = _patient)
    AND (_table IS NULL OR l.resource_table = _table)
    AND (_action IS NULL OR l.action = _action)
    AND (_from IS NULL OR l.created_at >= _from)
    AND (_to IS NULL OR l.created_at <= _to)
    AND (_actor_email IS NULL OR COALESCE(l.actor_email, p.email) ILIKE '%'||_actor_email||'%')
  ORDER BY l.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 1000));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_pii_access_logs(integer, uuid, uuid, text, text, timestamptz, timestamptz, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_pii_access_logs(integer, uuid, uuid, text, text, timestamptz, timestamptz, text) TO authenticated;

-- =========================================================
-- 4. LGPD subject requests
-- =========================================================
CREATE TABLE IF NOT EXISTS public.lgpd_subject_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid,
  subject_user_id uuid,
  subject_email text,
  subject_name text,
  request_type text NOT NULL CHECK (request_type IN ('access','copy','portability','rectify','delete','restrict')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','fulfilled','rejected','cancelled')),
  notes text,
  fulfilled_by uuid,
  fulfilled_at timestamptz,
  export_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lgpd_requests_status   ON public.lgpd_subject_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_subject  ON public.lgpd_subject_requests(subject_user_id);
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_requester ON public.lgpd_subject_requests(requester_user_id);

ALTER TABLE public.lgpd_subject_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage LGPD requests" ON public.lgpd_subject_requests;
CREATE POLICY "Admins manage LGPD requests"
ON public.lgpd_subject_requests
FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin'::app_role))
WITH CHECK (has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Subjects view own LGPD requests" ON public.lgpd_subject_requests;
CREATE POLICY "Subjects view own LGPD requests"
ON public.lgpd_subject_requests
FOR SELECT TO authenticated
USING (requester_user_id = auth.uid() OR subject_user_id = auth.uid());

DROP POLICY IF EXISTS "Users create own LGPD request" ON public.lgpd_subject_requests;
CREATE POLICY "Users create own LGPD request"
ON public.lgpd_subject_requests
FOR INSERT TO authenticated
WITH CHECK (
  requester_user_id = auth.uid()
  AND (subject_user_id IS NULL OR subject_user_id = auth.uid())
  AND export_data IS NULL
  AND status = 'pending'
);

DROP TRIGGER IF EXISTS update_lgpd_requests_updated_at ON public.lgpd_subject_requests;
CREATE TRIGGER update_lgpd_requests_updated_at
BEFORE UPDATE ON public.lgpd_subject_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin: list LGPD requests
CREATE OR REPLACE FUNCTION public.get_lgpd_requests(
  _status text DEFAULT NULL,
  _type text DEFAULT NULL,
  _limit integer DEFAULT 500
)
RETURNS SETOF public.lgpd_subject_requests
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;
  RETURN QUERY
  SELECT * FROM public.lgpd_subject_requests
  WHERE (_status IS NULL OR status = _status)
    AND (_type   IS NULL OR request_type = _type)
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 1000));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_lgpd_requests(text, text, integer) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_lgpd_requests(text, text, integer) TO authenticated;

-- Admin: export full data snapshot for a subject
CREATE OR REPLACE FUNCTION public.export_lgpd_subject_data(_subject_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  SELECT jsonb_build_object(
    'subject_user_id', _subject_user_id,
    'exported_at', now(),
    'exported_by', auth.uid(),
    'profile',                (SELECT to_jsonb(p) FROM public.profiles p WHERE p.user_id = _subject_user_id),
    'patients',               COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM public.patients x               WHERE x.user_id = _subject_user_id), '[]'::jsonb),
    'appointments',           COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM public.appointments x           WHERE x.user_id = _subject_user_id), '[]'::jsonb),
    'medical_records',        COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM public.medical_records x        WHERE x.user_id = _subject_user_id), '[]'::jsonb),
    'financial_transactions', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM public.financial_transactions x WHERE x.user_id = _subject_user_id), '[]'::jsonb),
    'digital_documents',      COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM public.digital_documents x      WHERE x.user_id = _subject_user_id), '[]'::jsonb),
    'patient_documents',      COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM public.patient_documents x      WHERE x.user_id = _subject_user_id), '[]'::jsonb),
    'teleconsultations',      COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM public.teleconsultations x      WHERE x.user_id = _subject_user_id), '[]'::jsonb),
    'access_log_as_actor',    COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM public.pii_access_log x         WHERE x.actor_user_id = _subject_user_id), '[]'::jsonb)
  ) INTO result;

  INSERT INTO public.pii_access_log(actor_user_id, action, resource_table, reason, metadata)
  VALUES (auth.uid(), 'view', 'lgpd_subject_export', 'LGPD subject export',
          jsonb_build_object('subject_user_id', _subject_user_id));

  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.export_lgpd_subject_data(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.export_lgpd_subject_data(uuid) TO authenticated;