
CREATE TABLE public.kite_booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.kite_bookings(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  note text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX kite_booking_events_booking_idx ON public.kite_booking_events(booking_id, created_at DESC);

GRANT SELECT ON public.kite_booking_events TO authenticated;
GRANT ALL ON public.kite_booking_events TO service_role;

ALTER TABLE public.kite_booking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read kite booking events"
ON public.kite_booking_events FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.kite_bookings_audit_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.kite_booking_events(booking_id, event_type, to_status, note, actor_id)
    VALUES (NEW.id, 'created', NEW.status, 'Booking created', auth.uid());
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.kite_booking_events(booking_id, event_type, from_status, to_status, note, actor_id)
    VALUES (NEW.id, 'status_change', OLD.status, NEW.status, NULL, auth.uid());

    IF NEW.status IN ('confirmado', 'erro') THEN
      INSERT INTO public.admin_logs(admin_user_id, action, target_table, target_id, details)
      VALUES (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        'kite_booking_status_' || NEW.status,
        'kite_bookings',
        NEW.id::text,
        jsonb_build_object(
          'from', OLD.status,
          'to', NEW.status,
          'patient_name', NEW.patient_name,
          'email', NEW.email
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kite_bookings_audit ON public.kite_bookings;
CREATE TRIGGER kite_bookings_audit
AFTER INSERT OR UPDATE ON public.kite_bookings
FOR EACH ROW EXECUTE FUNCTION public.kite_bookings_audit_trg();
