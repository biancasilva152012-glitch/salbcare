
-- Update get_public_professionals to filter out test/incomplete profiles
DROP FUNCTION IF EXISTS public.get_public_professionals(text);

CREATE FUNCTION public.get_public_professionals(specialty_filter text DEFAULT NULL::text)
 RETURNS TABLE(user_id uuid, name text, professional_type text, crm text, avatar_url text, consultation_price numeric, slot_duration integer, available_hours jsonb, pix_key text, card_link text, interval_minutes integer, min_advance_hours integer, meet_link text, council_number text, council_state text)
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
    p.meet_link,
    p.council_number,
    p.council_state
  FROM public.profiles p
  WHERE p.user_type = 'professional'
    AND p.payment_status IN ('active', 'trialing', 'trial')
    AND p.consultation_price IS NOT NULL
    AND p.consultation_price >= 10
    AND p.meet_link IS NOT NULL AND p.meet_link <> ''
    AND (p.council_number IS NOT NULL AND p.council_number <> '')
    AND (p.suspended_until IS NULL OR p.suspended_until < now())
    AND (specialty_filter IS NULL OR p.professional_type = specialty_filter)
    AND lower(p.name) NOT LIKE '%teste%'
    AND lower(p.name) NOT LIKE '%test%'
    AND lower(p.email) NOT LIKE '%teste@%'
    AND lower(p.email) NOT LIKE '%test@%';
$$;
