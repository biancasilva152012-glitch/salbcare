CREATE OR REPLACE FUNCTION public.get_public_professionals(specialty_filter text DEFAULT NULL::text)
 RETURNS TABLE(available_hours json, avatar_url text, card_link text, consultation_price numeric, council_number text, council_state text, crm text, interval_minutes integer, meet_link text, min_advance_hours integer, name text, pix_key text, professional_type text, slot_duration integer, user_id uuid, bio text, phone text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.available_hours::json,
    p.avatar_url,
    p.card_link,
    p.consultation_price,
    p.council_number,
    p.council_state,
    p.crm,
    p.interval_minutes,
    p.meet_link,
    p.min_advance_hours,
    p.name,
    p.pix_key,
    p.professional_type,
    p.slot_duration,
    p.user_id,
    p.bio,
    p.phone
  FROM profiles p
  WHERE p.user_type = 'professional'
    AND p.name NOT ILIKE '%teste%'
    AND p.name NOT ILIKE '%test%'
    AND p.name NOT ILIKE '%demo%'
    AND p.email NOT ILIKE '%teste@%'
    AND p.email NOT ILIKE '%test@%'
    AND p.email NOT ILIKE '%demo%'
    AND p.email <> 'livio@nymu.com'
    AND p.email <> 'biancadealbuquerquep@gmail.com'
    AND p.payment_status != 'expired'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.user_id AND ur.role = 'admin'
    )
    AND (specialty_filter IS NULL OR p.professional_type = specialty_filter);
$function$;