
ALTER TABLE public.appointments ADD COLUMN professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL;
