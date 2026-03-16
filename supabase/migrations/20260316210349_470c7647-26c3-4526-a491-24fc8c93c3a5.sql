
-- Add user_type column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'professional';

-- Add council_number and council_state columns for professional registration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS council_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS council_state text;

-- Update existing trigger function to include user_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, phone, professional_type, user_type, council_number, council_state)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'professional_type', 'medico'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'professional'),
    NEW.raw_user_meta_data->>'council_number',
    NEW.raw_user_meta_data->>'council_state'
  );
  RETURN NEW;
END;
$$;

-- RLS: Allow anon users to check if email exists (for duplicate detection)
CREATE OR REPLACE FUNCTION public.check_email_user_type(check_email text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_type FROM public.profiles WHERE email = check_email LIMIT 1;
$$;
