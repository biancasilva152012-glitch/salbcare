CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view processed stripe events"
ON public.processed_stripe_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_processed_at
ON public.processed_stripe_events(processed_at DESC);