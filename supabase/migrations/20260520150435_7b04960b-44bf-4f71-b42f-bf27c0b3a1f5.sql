
CREATE TABLE public.qr_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pousada_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  full_url TEXT NOT NULL,
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.qr_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view qr_partners"
  ON public.qr_partners FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert qr_partners"
  ON public.qr_partners FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

CREATE POLICY "Admins can delete qr_partners"
  ON public.qr_partners FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.increment_qr_scan(_slug TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.qr_partners
  SET scan_count = scan_count + 1
  WHERE slug = _slug;
$$;

GRANT EXECUTE ON FUNCTION public.increment_qr_scan(TEXT) TO anon, authenticated;
