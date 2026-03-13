
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_start_date timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'none';

-- Storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for payment-receipts bucket
CREATE POLICY "Users can upload own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
