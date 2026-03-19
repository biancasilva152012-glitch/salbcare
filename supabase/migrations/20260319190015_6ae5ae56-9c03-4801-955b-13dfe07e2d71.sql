-- Drop the broken anon insert policy and recreate without profiles check
DROP POLICY IF EXISTS "Public can insert appointments via booking" ON public.appointments;

CREATE POLICY "Public can insert appointments via booking"
ON public.appointments
FOR INSERT
TO anon
WITH CHECK (
  status = ANY (ARRAY['scheduled'::text, 'aguardando_comprovante'::text])
);