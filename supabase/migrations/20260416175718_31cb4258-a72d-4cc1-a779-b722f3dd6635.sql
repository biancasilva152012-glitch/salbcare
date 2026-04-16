-- 1. Tabela de parceiros
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  discount_percent NUMERIC NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  commission_percent NUMERIC NOT NULL DEFAULT 0 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast slug lookup (case-insensitive)
CREATE UNIQUE INDEX partners_slug_lower_idx ON public.partners (LOWER(slug));

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Only admins can manage partners
CREATE POLICY "Admins can manage partners"
  ON public.partners
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add referred_by column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON public.profiles (LOWER(referred_by));

-- 3. Public function to fetch partner by slug (for applying discount on signup/checkout)
-- Returns only non-sensitive fields needed by the frontend
CREATE OR REPLACE FUNCTION public.get_partner_by_slug(_slug TEXT)
RETURNS TABLE(
  slug TEXT,
  name TEXT,
  discount_percent NUMERIC,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.slug, p.name, p.discount_percent, p.status
  FROM public.partners p
  WHERE LOWER(p.slug) = LOWER(_slug)
    AND p.status = 'active'
  LIMIT 1;
$$;

-- 4. Admin-only function: list partners with referral stats
CREATE OR REPLACE FUNCTION public.get_partners_with_stats()
RETURNS TABLE(
  id UUID,
  name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  slug TEXT,
  discount_percent NUMERIC,
  commission_percent NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  total_referrals BIGINT,
  active_subscribers BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.contact_name,
    p.contact_email,
    p.slug,
    p.discount_percent,
    p.commission_percent,
    p.status,
    p.created_at,
    COALESCE(refs.total, 0) AS total_referrals,
    COALESCE(refs.active, 0) AS active_subscribers
  FROM public.partners p
  LEFT JOIN (
    SELECT
      LOWER(referred_by) AS slug_key,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE payment_status IN ('active', 'trialing', 'paid')) AS active
    FROM public.profiles
    WHERE referred_by IS NOT NULL
    GROUP BY LOWER(referred_by)
  ) refs ON refs.slug_key = LOWER(p.slug)
  WHERE has_role(auth.uid(), 'admin'::app_role)
  ORDER BY p.created_at DESC;
$$;

-- 5. Admin-only function: list referred professionals for a given partner
CREATE OR REPLACE FUNCTION public.get_partner_referrals(_slug TEXT)
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  email TEXT,
  professional_type TEXT,
  payment_status TEXT,
  plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pr.user_id,
    pr.name,
    pr.email,
    pr.professional_type,
    pr.payment_status,
    pr.plan,
    pr.created_at
  FROM public.profiles pr
  WHERE LOWER(pr.referred_by) = LOWER(_slug)
    AND has_role(auth.uid(), 'admin'::app_role)
  ORDER BY pr.created_at DESC;
$$;