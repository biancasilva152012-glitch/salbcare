CREATE TABLE public.academy_certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  purchase_id uuid NOT NULL REFERENCES public.academy_purchases(id) ON DELETE CASCADE,
  holder_name text NOT NULL,
  language text NOT NULL,
  score integer NOT NULL,
  slug text NOT NULL,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.academy_certificates TO service_role;

ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view certificates"
ON public.academy_certificates
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_academy_certificates_updated_at
BEFORE UPDATE ON public.academy_certificates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.verify_academy_certificate(_code text)
RETURNS TABLE(code text, holder_name text, language text, score integer, slug text, issued_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.code, c.holder_name, c.language, c.score, c.slug, c.issued_at
  FROM public.academy_certificates c
  WHERE upper(c.code) = upper(btrim(_code))
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.verify_academy_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_academy_certificate(text) TO anon, authenticated, service_role;