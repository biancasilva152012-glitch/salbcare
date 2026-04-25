-- Premium route block audit: registra quando o PremiumRoute redireciona um
-- usuário autenticado para /upgrade por falta de assinatura ativa.
CREATE TABLE IF NOT EXISTS public.premium_route_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  module text NOT NULL,
  reason text NOT NULL DEFAULT 'premium_required',
  attempted_path text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.premium_route_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own premium route blocks"
  ON public.premium_route_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own premium route blocks"
  ON public.premium_route_blocks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all premium route blocks"
  ON public.premium_route_blocks
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Validation trigger (mirrors validate_premium_block_attempt pattern)
CREATE OR REPLACE FUNCTION public.validate_premium_route_block()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.module IS NULL OR length(NEW.module) > 64 OR NEW.module !~ '^[A-Za-z0-9_\-]+$' THEN
    RAISE EXCEPTION 'invalid module: %', NEW.module;
  END IF;
  IF NEW.reason IS NULL OR length(NEW.reason) > 64 OR NEW.reason !~ '^[A-Za-z0-9_\-]+$' THEN
    RAISE EXCEPTION 'invalid reason: %', NEW.reason;
  END IF;
  IF NEW.attempted_path IS NOT NULL AND length(NEW.attempted_path) > 256 THEN
    RAISE EXCEPTION 'attempted_path too long';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_premium_route_block_trg
  BEFORE INSERT ON public.premium_route_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_premium_route_block();

CREATE INDEX IF NOT EXISTS idx_premium_route_blocks_user_created
  ON public.premium_route_blocks (user_id, created_at DESC);