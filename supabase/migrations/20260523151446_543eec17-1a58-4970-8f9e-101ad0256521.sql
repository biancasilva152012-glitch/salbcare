
-- 1) Invoices: allow owner UPDATE
CREATE POLICY "Users can update own invoices"
ON public.invoices FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2) Patient documents: allow owner UPDATE (metadata only; file path immutable in practice)
CREATE POLICY "Users can update own patient documents"
ON public.patient_documents FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3) Tighten demo_usage_counters anonymous UPDATE: anon can only touch
--    guest-owned rows (user_id IS NULL). Authenticated users can still
--    update their own rows.
DROP POLICY IF EXISTS "Anyone can update guest counters" ON public.demo_usage_counters;
CREATE POLICY "Anyone can update guest counters"
ON public.demo_usage_counters FOR UPDATE TO anon, authenticated
USING (
  (auth.uid() IS NULL AND user_id IS NULL AND guest_id IS NOT NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
)
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL AND guest_id IS NOT NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can insert guest counters" ON public.demo_usage_counters;
CREATE POLICY "Anyone can insert guest counters"
ON public.demo_usage_counters FOR INSERT TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL AND guest_id IS NOT NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can read guest counters" ON public.demo_usage_counters;
CREATE POLICY "Anyone can read guest counters"
ON public.demo_usage_counters FOR SELECT TO anon, authenticated
USING (
  (auth.uid() IS NULL AND guest_id IS NOT NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- 4) Field-level protection for partners: public-safe info only
CREATE OR REPLACE FUNCTION public.get_partner_public_info(_slug text)
RETURNS TABLE(slug text, name text, discount_percent numeric, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.slug, p.name, p.discount_percent, p.status
  FROM public.partners p
  WHERE LOWER(p.slug) = LOWER(_slug) AND p.status = 'active'
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_partner_public_info(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_partner_public_info(text) TO anon, authenticated;

COMMENT ON TABLE public.partners IS
  'Contact PII (contact_email, contact_name) is admin-only via RLS. Public callers must use get_partner_public_info(slug) which returns only name/slug/discount/status.';
