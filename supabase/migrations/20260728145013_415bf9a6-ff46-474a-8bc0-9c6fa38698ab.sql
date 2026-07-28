DROP POLICY IF EXISTS "Anyone can view active local partners" ON public.local_partners;

CREATE POLICY "Anyone can view active published local partners"
  ON public.local_partners FOR SELECT
  USING (
    (active = true AND is_published = true)
    OR has_role(auth.uid(), 'admin'::app_role)
  );