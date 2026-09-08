CREATE TABLE public.academy_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  format_label text NOT NULL DEFAULT 'Apostila prática em PDF',
  status text NOT NULL DEFAULT 'soon',
  status_label text NOT NULL DEFAULT 'Em preparação',
  price_cents integer,
  stripe_price_id text,
  summary text NOT NULL DEFAULT '',
  description text[] NOT NULL DEFAULT '{}',
  contents text[] NOT NULL DEFAULT '{}',
  audience text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.academy_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_products TO authenticated;
GRANT ALL ON public.academy_products TO service_role;
ALTER TABLE public.academy_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published academy products are public"
ON public.academy_products FOR SELECT
USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage academy products"
ON public.academy_products FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.pro_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL UNIQUE,
  name text NOT NULL,
  billing_interval text NOT NULL DEFAULT 'month',
  price_cents integer NOT NULL DEFAULT 0,
  stripe_price_id text,
  features text[] NOT NULL DEFAULT '{}',
  highlight boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pro_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_plans TO authenticated;
GRANT ALL ON public.pro_plans TO service_role;
ALTER TABLE public.pro_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published plans are public"
ON public.pro_plans FOR SELECT
USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage plans"
ON public.pro_plans FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER academy_products_updated_at
BEFORE UPDATE ON public.academy_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER pro_plans_updated_at
BEFORE UPDATE ON public.pro_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();