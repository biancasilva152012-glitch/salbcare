CREATE TABLE public.mentorship_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mentorship_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mentorship messages"
  ON public.mentorship_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = professional_id);

CREATE POLICY "Users can insert own mentorship messages"
  ON public.mentorship_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Users can delete own mentorship messages"
  ON public.mentorship_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = professional_id);

CREATE INDEX idx_mentorship_messages_professional ON public.mentorship_messages (professional_id, created_at DESC);