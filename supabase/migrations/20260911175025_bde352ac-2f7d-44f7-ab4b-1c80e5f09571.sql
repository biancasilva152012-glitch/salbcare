GRANT SELECT ON public.academy_purchases TO authenticated;

DROP POLICY IF EXISTS "Admins read academy purchases" ON public.academy_purchases;
CREATE POLICY "Admins read academy purchases"
ON public.academy_purchases FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.academy_purchases REPLICA IDENTITY FULL;
ALTER TABLE public.pro_subscriptions REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.academy_purchases;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pro_subscriptions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;