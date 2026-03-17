
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interval_minutes integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS min_advance_hours integer NOT NULL DEFAULT 3;
