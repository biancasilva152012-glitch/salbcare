CREATE POLICY "Active pro subscribers read materials"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pro-materials' AND public.has_active_pro(auth.uid()));

CREATE POLICY "Admins manage pro materials"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'pro-materials' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'pro-materials' AND public.has_role(auth.uid(), 'admin'::public.app_role));