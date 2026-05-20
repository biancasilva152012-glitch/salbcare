
CREATE TABLE public.kite_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure text NOT NULL,
  type text NOT NULL CHECK (type IN ('presencial','online')),
  patient_name text NOT NULL,
  email text NOT NULL,
  preferred_date date,
  time_preference text,
  notes text,
  pousada_ref text,
  stripe_session_id text UNIQUE,
  amount_paid numeric NOT NULL DEFAULT 0,
  remaining_balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kite_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view kite bookings"
ON public.kite_bookings FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update kite bookings"
ON public.kite_bookings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
