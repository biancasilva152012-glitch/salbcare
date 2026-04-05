
CREATE TABLE public.exam_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lab_name TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own exam requests"
  ON public.exam_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own exam requests"
  ON public.exam_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all exam requests"
  ON public.exam_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
