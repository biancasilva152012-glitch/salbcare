-- Add LGPD consent tracking to leads_demo
ALTER TABLE public.leads_demo
  ADD COLUMN IF NOT EXISTS lgpd_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lgpd_consent_at timestamp with time zone;

-- Tighten INSERT policy to require lgpd_consent = true
DROP POLICY IF EXISTS "Anyone can submit demo lead" ON public.leads_demo;

CREATE POLICY "Anyone can submit demo lead"
ON public.leads_demo
FOR INSERT
TO anon, authenticated
WITH CHECK (
  nome IS NOT NULL AND length(nome) > 0
  AND email IS NOT NULL AND length(email) > 0
  AND whatsapp IS NOT NULL AND length(whatsapp) > 0
  AND dor_principal IS NOT NULL AND length(dor_principal) > 0
  AND lgpd_consent = true
);