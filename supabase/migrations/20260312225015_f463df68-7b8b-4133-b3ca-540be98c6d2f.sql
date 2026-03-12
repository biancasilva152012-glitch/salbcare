
-- Lawyers table
CREATE TABLE public.lawyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  consultation_price numeric NOT NULL,
  rating numeric NOT NULL DEFAULT 5.0,
  reviews_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lawyers" ON public.lawyers FOR SELECT TO authenticated USING (true);

-- Legal consultations
CREATE TABLE public.legal_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lawyer_id uuid NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own legal_consultations" ON public.legal_consultations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own legal_consultations" ON public.legal_consultations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own legal_consultations" ON public.legal_consultations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own legal_consultations" ON public.legal_consultations FOR DELETE TO authenticated USING (auth.uid() = user_id);
