-- 1. Drop overly permissive policies on service_requests
DROP POLICY IF EXISTS "Anyone can create service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Anyone can view service request by id" ON public.service_requests;

-- Add proper policies for service_requests
CREATE POLICY "Authenticated can create service requests"
ON public.service_requests FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Professionals can view own service requests"
ON public.service_requests FOR SELECT TO authenticated
USING (professional_id = auth.uid());

-- 2. Remove anon INSERT on appointments
DROP POLICY IF EXISTS "Public can insert appointments via booking" ON public.appointments;

-- 3. Create ambassador_applications table
CREATE TABLE IF NOT EXISTS public.ambassador_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  social_media text,
  motivation text,
  status text NOT NULL DEFAULT 'pending',
  coupon_code text,
  conversions integer NOT NULL DEFAULT 0,
  free_months_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ambassador apps"
ON public.ambassador_applications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ambassador apps"
ON public.ambassador_applications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all ambassador apps"
ON public.ambassador_applications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ambassador apps"
ON public.ambassador_applications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Create ambassador_waitlist table
CREATE TABLE IF NOT EXISTS public.ambassador_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ambassador_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
ON public.ambassador_waitlist FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view waitlist"
ON public.ambassador_waitlist FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Create count function for ambassador spots
CREATE OR REPLACE FUNCTION public.get_ambassador_spots_taken()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.ambassador_applications
  WHERE status IN ('approved', 'pending')
$$;

-- 6. Make booking-receipts bucket private
UPDATE storage.buckets SET public = false WHERE id = 'booking-receipts';