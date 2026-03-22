
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS council_document_path text;
