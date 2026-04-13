
-- Create secure function for public profile lookup
CREATE OR REPLACE FUNCTION public.get_public_profile_by_slug(_slug text)
RETURNS TABLE(
  name text,
  professional_type text,
  bio text,
  phone text,
  email text,
  profile_slug text,
  council_number text,
  council_state text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.name,
    p.professional_type,
    p.bio,
    p.phone,
    p.email,
    p.profile_slug,
    p.council_number,
    p.council_state
  FROM profiles p
  WHERE p.profile_slug = _slug
    AND p.user_type = 'professional'
  LIMIT 1;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_slug(text) TO authenticated;
