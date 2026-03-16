
-- Add suspended_until column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_until timestamptz DEFAULT NULL;

-- Function to check cancellations and apply suspension
CREATE OR REPLACE FUNCTION public.check_and_apply_suspension(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cancel_count integer;
BEGIN
  -- Count cancellations in the current month
  SELECT COUNT(*) INTO cancel_count
  FROM public.appointments
  WHERE user_id = _user_id
    AND status = 'cancelled'
    AND updated_at >= date_trunc('month', now())
    AND updated_at < date_trunc('month', now()) + interval '1 month';

  -- If 3+ cancellations, suspend for 7 days
  IF cancel_count >= 3 THEN
    UPDATE public.profiles
    SET suspended_until = now() + interval '7 days'
    WHERE user_id = _user_id
      AND (suspended_until IS NULL OR suspended_until < now());
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Update get_public_professionals to exclude suspended profiles
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
    AND (p.suspended_until IS NULL OR p.suspended_until < now())
    AND (specialty_filter IS NULL OR p.professional_type = specialty_filter);
$$;
