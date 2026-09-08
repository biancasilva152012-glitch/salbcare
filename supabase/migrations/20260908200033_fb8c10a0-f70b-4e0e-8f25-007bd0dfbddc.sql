CREATE TABLE public.academy_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  email text,
  slug text NOT NULL,
  stripe_session_id text NOT NULL UNIQUE,
  downloads integer NOT NULL DEFAULT 0,
  max_downloads integer NOT NULL DEFAULT 5,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.academy_purchases TO service_role;

ALTER TABLE public.academy_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages academy purchases"
ON public.academy_purchases FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TRIGGER update_academy_purchases_updated_at
BEFORE UPDATE ON public.academy_purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();