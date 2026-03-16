
-- Drop the overly permissive anon INSERT policy
DROP POLICY IF EXISTS "Public can insert appointments via booking" ON public.appointments;

-- Create a restricted anon INSERT policy that only allows inserting
-- appointments for user_ids that exist in profiles (real doctors)
-- and prevents setting status to anything other than 'scheduled'
CREATE POLICY "Public can insert appointments via booking"
ON public.appointments
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = appointments.user_id)
  AND status = 'scheduled'
);
