
-- Update get_public_professionals to also require stripe_onboarding_complete
CREATE OR REPLACE FUNCTION public.get_public_professionals(specialty_filter text DEFAULT NULL::text)
 RETURNS TABLE(user_id uuid, name text, professional_type text, crm text, avatar_url text, consultation_price numeric, slot_duration integer, available_hours jsonb)
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
    p.available_hours
  FROM public.profiles p
  WHERE p.payment_status IN ('active', 'trialing', 'trial')
    AND p.consultation_price IS NOT NULL
    AND p.stripe_onboarding_complete = true
    AND (specialty_filter IS NULL OR p.professional_type = specialty_filter);
$$;
