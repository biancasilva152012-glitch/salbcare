
CREATE TABLE public.local_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  location TEXT,
  description TEXT,
  image_url TEXT,
  whatsapp TEXT,
  instagram TEXT,
  website TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.local_partners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.local_partners TO authenticated;
GRANT ALL ON public.local_partners TO service_role;

ALTER TABLE public.local_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active local partners"
  ON public.local_partners FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert local partners"
  ON public.local_partners FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update local partners"
  ON public.local_partners FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete local partners"
  ON public.local_partners FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_local_partners_updated_at
  BEFORE UPDATE ON public.local_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_local_partners_active_sort ON public.local_partners (active, sort_order DESC, created_at DESC);
CREATE INDEX idx_local_partners_category ON public.local_partners (category);
