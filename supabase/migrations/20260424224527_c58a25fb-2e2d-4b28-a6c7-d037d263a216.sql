-- Counters table: bridges anonymous demo usage with the logged-in account
CREATE TABLE public.demo_usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id text UNIQUE,
  user_id uuid UNIQUE,
  patients_created integer NOT NULL DEFAULT 0,
  appointments_created integer NOT NULL DEFAULT 0,
  telehealth_views integer NOT NULL DEFAULT 0,
  telehealth_attempts integer NOT NULL DEFAULT 0,
  last_synced_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT demo_usage_counters_owner_check
    CHECK (guest_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX idx_demo_usage_counters_guest_id ON public.demo_usage_counters(guest_id);
CREATE INDEX idx_demo_usage_counters_user_id ON public.demo_usage_counters(user_id);

ALTER TABLE public.demo_usage_counters ENABLE ROW LEVEL SECURITY;

-- Anonymous + authenticated visitors can read/write their guest row.
-- The guest_id is a random opaque token generated client-side; it acts as a
-- lightweight access key for the anonymous session.
CREATE POLICY "Anyone can read guest counters"
  ON public.demo_usage_counters
  FOR SELECT
  TO anon, authenticated
  USING (guest_id IS NOT NULL OR user_id = auth.uid());

CREATE POLICY "Anyone can insert guest counters"
  ON public.demo_usage_counters
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (guest_id IS NOT NULL AND user_id IS NULL)
    OR user_id = auth.uid()
  );

CREATE POLICY "Anyone can update guest counters"
  ON public.demo_usage_counters
  FOR UPDATE
  TO anon, authenticated
  USING (guest_id IS NOT NULL OR user_id = auth.uid())
  WITH CHECK (guest_id IS NOT NULL OR user_id = auth.uid());

CREATE TRIGGER trg_demo_usage_counters_updated_at
  BEFORE UPDATE ON public.demo_usage_counters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Merge guest counters into the authenticated user's row (called after signup)
CREATE OR REPLACE FUNCTION public.merge_demo_counters(_guest_id text)
RETURNS public.demo_usage_counters
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_row public.demo_usage_counters;
  merged_row public.demo_usage_counters;
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'merge_demo_counters requires an authenticated user';
  END IF;

  SELECT * INTO guest_row
  FROM public.demo_usage_counters
  WHERE guest_id = _guest_id AND user_id IS NULL
  LIMIT 1;

  -- Upsert the user-owned row, summing the guest counters when present.
  INSERT INTO public.demo_usage_counters (user_id, patients_created, appointments_created, telehealth_views, telehealth_attempts, last_synced_at)
  VALUES (
    current_user_id,
    COALESCE(guest_row.patients_created, 0),
    COALESCE(guest_row.appointments_created, 0),
    COALESCE(guest_row.telehealth_views, 0),
    COALESCE(guest_row.telehealth_attempts, 0),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    patients_created = public.demo_usage_counters.patients_created + COALESCE(guest_row.patients_created, 0),
    appointments_created = public.demo_usage_counters.appointments_created + COALESCE(guest_row.appointments_created, 0),
    telehealth_views = public.demo_usage_counters.telehealth_views + COALESCE(guest_row.telehealth_views, 0),
    telehealth_attempts = public.demo_usage_counters.telehealth_attempts + COALESCE(guest_row.telehealth_attempts, 0),
    last_synced_at = now()
  RETURNING * INTO merged_row;

  -- Detach the guest row so subsequent calls don't double-count.
  IF guest_row.id IS NOT NULL THEN
    DELETE FROM public.demo_usage_counters WHERE id = guest_row.id;
  END IF;

  RETURN merged_row;
END;
$$;