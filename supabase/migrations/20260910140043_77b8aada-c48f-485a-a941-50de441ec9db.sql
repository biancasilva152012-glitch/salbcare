CREATE OR REPLACE FUNCTION public.pii_access_log_sign()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
  NEW.row_hash  := encode(extensions.digest(v_prev || '|' || v_payload, 'sha256'), 'hex');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_pii_access_log_chain(_limit integer DEFAULT 10000)
 RETURNS TABLE(ok boolean, total bigint, first_invalid_id uuid, first_invalid_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
    expected := encode(extensions.digest(
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
$function$;