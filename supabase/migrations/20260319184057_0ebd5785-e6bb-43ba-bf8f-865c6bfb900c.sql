
-- Add receipt_url column to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS receipt_url text;

-- Allow authenticated users to insert appointments for any professional (booking flow)
CREATE POLICY "Authenticated can book appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = appointments.user_id)
  AND status IN ('scheduled', 'aguardando_comprovante')
);

-- Update anon insert policy to allow new status
DROP POLICY IF EXISTS "Public can insert appointments via booking" ON public.appointments;
CREATE POLICY "Public can insert appointments via booking"
ON public.appointments
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = appointments.user_id)
  AND status IN ('scheduled', 'aguardando_comprovante')
);

-- Create booking-receipts storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('booking-receipts', 'booking-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage: anyone can upload to booking-receipts
CREATE POLICY "Anyone can upload booking receipts"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'booking-receipts');

-- Storage: anyone can view booking receipts
CREATE POLICY "Anyone can view booking receipts"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'booking-receipts');
