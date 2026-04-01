-- Fix overly permissive INSERT on service_requests
DROP POLICY IF EXISTS "Authenticated can create service requests" ON public.service_requests;
CREATE POLICY "Authenticated can create service requests"
ON public.service_requests FOR INSERT TO authenticated
WITH CHECK (professional_id IS NOT NULL);

-- Fix overly permissive INSERT on ambassador_waitlist
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.ambassador_waitlist;
CREATE POLICY "Authenticated can join waitlist"
ON public.ambassador_waitlist FOR INSERT TO authenticated
WITH CHECK (email IS NOT NULL AND length(email) > 0);