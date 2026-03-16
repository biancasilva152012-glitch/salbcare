
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consultation_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS slot_duration integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS office_address text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS available_hours jsonb DEFAULT '{"mon":[],"tue":[],"wed":[],"thu":[],"fri":[],"sat":[],"sun":[]}';
