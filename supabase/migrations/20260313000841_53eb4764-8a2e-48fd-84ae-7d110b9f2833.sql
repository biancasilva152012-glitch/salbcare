ALTER TABLE public.invoices
  ADD COLUMN cpf_cnpj text DEFAULT NULL,
  ADD COLUMN address_street text DEFAULT NULL,
  ADD COLUMN address_number text DEFAULT NULL,
  ADD COLUMN address_complement text DEFAULT NULL,
  ADD COLUMN address_neighborhood text DEFAULT NULL,
  ADD COLUMN address_city text DEFAULT NULL,
  ADD COLUMN address_state text DEFAULT NULL,
  ADD COLUMN address_zip text DEFAULT NULL,
  ADD COLUMN service_code text DEFAULT NULL,
  ADD COLUMN iss_rate numeric DEFAULT NULL;