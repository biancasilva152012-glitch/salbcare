
-- Add new columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_slug text UNIQUE,
ADD COLUMN IF NOT EXISTS referral_code text,
ADD COLUMN IF NOT EXISTS acquisition_source text;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles (profile_slug);

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug: lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(trim(NEW.name));
  base_slug := translate(base_slug, 'àáâãäåèéêëìíîïòóôõöùúûüýÿñç', 'aaaaaaeeeeiiiioooooouuuuyyñc');
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  -- Only generate for professionals
  IF NEW.user_type != 'professional' OR base_slug = '' THEN
    RETURN NEW;
  END IF;

  -- If slug already set, skip
  IF NEW.profile_slug IS NOT NULL AND NEW.profile_slug != '' THEN
    RETURN NEW;
  END IF;

  final_slug := base_slug;
  LOOP
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profile_slug = final_slug AND id != NEW.id) THEN
      NEW.profile_slug := final_slug;
      EXIT;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger to auto-generate slug on insert/update
CREATE TRIGGER generate_slug_on_profile
BEFORE INSERT OR UPDATE OF name ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_profile_slug();

-- Allow anonymous users to view professional profiles by slug (for public profile pages)
CREATE POLICY "Anon can view professional profiles by slug"
ON public.profiles
FOR SELECT
TO anon
USING (
  user_type = 'professional' 
  AND profile_slug IS NOT NULL 
  AND profile_slug != ''
);

-- Update existing professionals to generate slugs
UPDATE public.profiles SET profile_slug = NULL WHERE user_type = 'professional' AND profile_slug IS NULL;
