-- Enable realtime for appointments table so professionals get notified of new bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
