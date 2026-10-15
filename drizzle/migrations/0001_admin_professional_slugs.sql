CREATE OR REPLACE FUNCTION public.admin_professional_slugs()
RETURNS TABLE(user_id uuid, profile_slug text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT p.user_id, p.profile_slug FROM profiles p WHERE p.user_type = 'professional';
END $$;
REVOKE ALL ON FUNCTION public.admin_professional_slugs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_professional_slugs() TO authenticated;