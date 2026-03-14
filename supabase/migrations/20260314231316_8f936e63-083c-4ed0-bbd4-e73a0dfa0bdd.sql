ALTER TABLE public.teleconsultations 
  ADD COLUMN IF NOT EXISTS room_name text,
  ADD COLUMN IF NOT EXISTS room_url text;