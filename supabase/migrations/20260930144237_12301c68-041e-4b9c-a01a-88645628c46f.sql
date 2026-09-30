CREATE OR REPLACE FUNCTION public.admin_professionals_overview()
RETURNS TABLE(user_id uuid, name text, email text, professional_type text, plan text, payment_status text, created_at timestamptz, sub_plan text, sub_status text, upcoming_count bigint, total_appointments bigint, next_appointment date)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT p.user_id, p.name, p.email, p.professional_type, p.plan, p.payment_status, p.created_at,
    s.plan, s.status,
    (SELECT count(*) FROM appointments a WHERE a.user_id = p.user_id AND a.date >= current_date AND a.status <> 'cancelled' AND a.appointment_type <> 'blocked'),
    (SELECT count(*) FROM appointments a WHERE a.user_id = p.user_id AND a.appointment_type <> 'blocked'),
    (SELECT min(a.date) FROM appointments a WHERE a.user_id = p.user_id AND a.date >= current_date AND a.status <> 'cancelled' AND a.appointment_type <> 'blocked')
  FROM profiles p
  LEFT JOIN LATERAL (SELECT ps.plan, ps.status FROM pro_subscriptions ps WHERE ps.user_id = p.user_id ORDER BY ps.updated_at DESC LIMIT 1) s ON true
  WHERE p.user_type = 'professional'
  ORDER BY p.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.admin_professionals_overview() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_professionals_overview() TO authenticated;