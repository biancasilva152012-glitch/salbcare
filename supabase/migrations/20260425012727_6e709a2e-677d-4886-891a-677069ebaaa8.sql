CREATE TABLE IF NOT EXISTS public.premium_block_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  reason text NOT NULL DEFAULT 'plan_required',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS premium_block_attempts_user_created_idx
  ON public.premium_block_attempts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS premium_block_attempts_module_idx
  ON public.premium_block_attempts (user_id, module);

ALTER TABLE public.premium_block_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own block attempts" ON public.premium_block_attempts;
CREATE POLICY "Users can insert own block attempts"
ON public.premium_block_attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own block attempts" ON public.premium_block_attempts;
CREATE POLICY "Users can view own block attempts"
ON public.premium_block_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all block attempts" ON public.premium_block_attempts;
CREATE POLICY "Admins can view all block attempts"
ON public.premium_block_attempts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.validate_premium_block_attempt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.module IS NULL OR length(NEW.module) > 64 OR NEW.module !~ '^[A-Za-z0-9_\-]+$' THEN
    RAISE EXCEPTION 'invalid module: %', NEW.module;
  END IF;
  IF NEW.reason IS NULL OR length(NEW.reason) > 64 OR NEW.reason !~ '^[A-Za-z0-9_\-]+$' THEN
    RAISE EXCEPTION 'invalid reason: %', NEW.reason;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_premium_block_attempt_trg ON public.premium_block_attempts;
CREATE TRIGGER validate_premium_block_attempt_trg
BEFORE INSERT OR UPDATE ON public.premium_block_attempts
FOR EACH ROW EXECUTE FUNCTION public.validate_premium_block_attempt();