
-- Create a security definer function to list public professional profiles
-- Only exposes limited fields needed for the directory
CREATE OR REPLACE FUNCTION public.get_public_professionals(specialty_filter text DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  name text,
  professional_type text,
  crm text,
  avatar_url text,
  consultation_price numeric,
  slot_duration integer,
  available_hours jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
  WHERE p.payment_status IN ('active', 'trialing')
    AND p.consultation_price IS NOT NULL
    AND (specialty_filter IS NULL OR p.professional_type = specialty_filter);
$$;
