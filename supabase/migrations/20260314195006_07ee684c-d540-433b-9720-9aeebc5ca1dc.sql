CREATE POLICY "Public can insert appointments via booking" ON public.appointments
  FOR INSERT TO anon WITH CHECK (true);