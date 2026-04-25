-- Tabela de auditoria de redirects (front /experimente + backend safeRedirect)
CREATE TABLE public.redirect_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,                          -- NULL quando visitante (sem login)
  flow text NOT NULL,                         -- 'visitor' | 'authed'
  source text NOT NULL,                       -- ex.: 'experimente', 'create-checkout', 'customer-portal', 'stripe-portal'
  preserved_keys text[] NOT NULL DEFAULT '{}',-- só NOMES (utm_source, ref...) — nunca valores
  resolved_path text NULL,                    -- caminho interno final (ex.: /dashboard)
  outcome text NOT NULL,                      -- 'ok' | 'fallback-empty' | 'fallback-disallowed' | 'fallback-traversal' | 'fallback-external-origin' | 'fallback-ambiguous'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Validação: nada de valores sensíveis no nome das chaves preservadas (max 64 chars cada).
CREATE OR REPLACE FUNCTION public.validate_redirect_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  k text;
BEGIN
  IF NEW.flow NOT IN ('visitor', 'authed') THEN
    RAISE EXCEPTION 'invalid flow: %', NEW.flow;
  END IF;
  IF NEW.outcome NOT IN ('ok','fallback-empty','fallback-disallowed','fallback-traversal','fallback-external-origin','fallback-ambiguous') THEN
    RAISE EXCEPTION 'invalid outcome: %', NEW.outcome;
  END IF;
  IF NEW.preserved_keys IS NOT NULL THEN
    FOREACH k IN ARRAY NEW.preserved_keys LOOP
      IF length(k) > 64 OR k !~ '^[A-Za-z0-9_\-]+$' THEN
        RAISE EXCEPTION 'invalid preserved key: %', k;
      END IF;
    END LOOP;
  END IF;
  IF NEW.resolved_path IS NOT NULL AND length(NEW.resolved_path) > 256 THEN
    RAISE EXCEPTION 'resolved_path too long';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_redirect_audit_event
BEFORE INSERT OR UPDATE ON public.redirect_audit_events
FOR EACH ROW EXECUTE FUNCTION public.validate_redirect_audit_event();

CREATE INDEX idx_redirect_audit_events_user_created
  ON public.redirect_audit_events (user_id, created_at DESC);

ALTER TABLE public.redirect_audit_events ENABLE ROW LEVEL SECURITY;

-- Usuário vê SOMENTE os próprios eventos
CREATE POLICY "Users can view own redirect audit"
ON public.redirect_audit_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin vê tudo
CREATE POLICY "Admins can view all redirect audit"
ON public.redirect_audit_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Inserts são feitos apenas pela edge function (service role) — nenhuma policy de INSERT
-- é concedida a authenticated/anon, então RLS bloqueia inserts diretos do client.