
DROP FUNCTION IF EXISTS public.get_public_professionals(text);

CREATE FUNCTION public.get_public_professionals(specialty_filter text DEFAULT NULL::text)
 RETURNS TABLE(user_id uuid, name text, professional_type text, crm text, avatar_url text, consultation_price numeric, slot_duration integer, available_hours jsonb, pix_key text, card_link text, interval_minutes integer, min_advance_hours integer, meet_link text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT
    p.user_id,
    p.name,
    p.professional_type,
    p.crm,
    p.avatar_url,
    p.consultation_price,
    p.slot_duration,
    p.available_hours,
    p.pix_key,
    p.card_link,
    p.interval_minutes,
    p.min_advance_hours,
    p.meet_link
  FROM public.profiles p
  WHERE p.payment_status IN ('active', 'trialing', 'trial')
    AND p.consultation_price IS NOT NULL
    AND (p.suspended_until IS NULL OR p.suspended_until < now())
    AND (specialty_filter IS NULL OR p.professional_type = specialty_filter);
$$;
