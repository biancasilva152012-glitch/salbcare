ALTER TABLE public.patients 
  ADD COLUMN IF NOT EXISTS initial_anamnesis text DEFAULT null,
  ADD COLUMN IF NOT EXISTS procedure_performed text DEFAULT null;