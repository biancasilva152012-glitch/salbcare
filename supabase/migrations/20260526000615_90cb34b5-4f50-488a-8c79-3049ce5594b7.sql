-- 1) Audit trigger for teleconsultations (was missing from the sensitive-tables set)
DROP TRIGGER IF EXISTS trg_audit_teleconsultations ON public.teleconsultations;
CREATE TRIGGER trg_audit_teleconsultations
AFTER INSERT OR UPDATE OR DELETE ON public.teleconsultations
FOR EACH ROW EXECUTE FUNCTION public.log_pii_change();

-- 2) Extend get_pii_access_logs with actor payment-status filter
CREATE OR REPLACE FUNCTION public.get_pii_access_logs(
  _limit integer DEFAULT 200,
  _actor uuid DEFAULT NULL,
  _patient uuid DEFAULT NULL,
  _table text DEFAULT NULL,
  _action text DEFAULT NULL,
  _from timestamp with time zone DEFAULT NULL,
  _to timestamp with time zone DEFAULT NULL,
  _actor_email text DEFAULT NULL,
  _actor_status text DEFAULT NULL
)
RETURNS TABLE(
  id uuid, actor_user_id uuid, actor_email text, actor_status text,
  action text, resource_table text, resource_id uuid,
  patient_id uuid, patient_name text, reason text, ip_address text,
  created_at timestamp with time zone, prev_hash text, row_hash text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;
  RETURN QUERY
  SELECT
    l.id, l.actor_user_id,
    COALESCE(l.actor_email, p.email),
    p.payment_status,
    l.action, l.resource_table, l.resource_id,
    l.patient_id, l.patient_name, l.reason, l.ip_address,
    l.created_at, l.prev_hash, l.row_hash
  FROM public.pii_access_log l
  LEFT JOIN public.profiles p ON p.user_id = l.actor_user_id
  WHERE (_actor IS NULL OR l.actor_user_id = _actor)
    AND (_patient IS NULL OR l.patient_id = _patient)
    AND (_table IS NULL OR l.resource_table = _table)
    AND (_action IS NULL OR l.action = _action)
    AND (_from IS NULL OR l.created_at >= _from)
    AND (_to IS NULL OR l.created_at <= _to)
    AND (_actor_email IS NULL OR COALESCE(l.actor_email, p.email) ILIKE '%'||_actor_email||'%')
    AND (_actor_status IS NULL OR p.payment_status = _actor_status)
  ORDER BY l.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 1000));
END;
$function$;