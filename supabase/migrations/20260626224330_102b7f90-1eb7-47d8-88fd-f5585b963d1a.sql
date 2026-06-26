
-- ============================================================
-- Rate limiting + progressive lockout for sensitive endpoints
-- ============================================================

CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_type      text NOT NULL CHECK (key_type IN ('email','ip','composite')),
  key_value     text NOT NULL,
  action        text NOT NULL CHECK (action IN ('login','reset','sensitive')),
  attempts      integer NOT NULL DEFAULT 0,
  window_start  timestamptz NOT NULL DEFAULT now(),
  last_attempt  timestamptz NOT NULL DEFAULT now(),
  locked_until  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key_type, key_value, action)
);

GRANT ALL ON public.auth_rate_limits TO service_role;
-- intentionally NO grants to anon/authenticated — table is backend-only

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Admins can view (read-only) for monitoring/forensics.
CREATE POLICY "auth_rate_limits_admin_select"
  ON public.auth_rate_limits
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS auth_rate_limits_lookup_idx
  ON public.auth_rate_limits (key_type, key_value, action);
CREATE INDEX IF NOT EXISTS auth_rate_limits_locked_idx
  ON public.auth_rate_limits (locked_until) WHERE locked_until IS NOT NULL;

-- ============================================================
-- check_and_record_rate_limit
-- Records 1 attempt against (key_type, key_value, action) and
-- returns whether the caller is locked out.
--
-- Progressive lockout (default thresholds, override via params):
--   attempts >=  3 within window  -> lock 1 minute
--   attempts >=  5                -> lock 15 minutes
--   attempts >=  8                -> lock 1 hour
--   attempts >= 12                -> lock 24 hours
-- The window resets after `window_seconds` of no activity OR after a
-- successful clear_rate_limit() call.
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_and_record_rate_limit(
  _key_type text,
  _key_value text,
  _action text,
  _window_seconds integer DEFAULT 900   -- 15 min sliding window
)
RETURNS TABLE (allowed boolean, attempts integer, locked_until timestamptz, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.auth_rate_limits;
  new_attempts integer;
  new_lock timestamptz;
  v_now timestamptz := now();
BEGIN
  IF _key_type NOT IN ('email','ip','composite') THEN
    RAISE EXCEPTION 'invalid key_type';
  END IF;
  IF _action NOT IN ('login','reset','sensitive') THEN
    RAISE EXCEPTION 'invalid action';
  END IF;
  IF _key_value IS NULL OR length(_key_value) = 0 OR length(_key_value) > 320 THEN
    RAISE EXCEPTION 'invalid key_value';
  END IF;

  -- Upsert a row for this identifier + action.
  INSERT INTO public.auth_rate_limits (key_type, key_value, action, attempts, window_start, last_attempt)
  VALUES (_key_type, _key_value, _action, 1, v_now, v_now)
  ON CONFLICT (key_type, key_value, action) DO UPDATE
    SET attempts = CASE
                     WHEN public.auth_rate_limits.last_attempt < v_now - make_interval(secs => _window_seconds)
                       THEN 1
                     ELSE public.auth_rate_limits.attempts + 1
                   END,
        window_start = CASE
                         WHEN public.auth_rate_limits.last_attempt < v_now - make_interval(secs => _window_seconds)
                           THEN v_now
                         ELSE public.auth_rate_limits.window_start
                       END,
        last_attempt = v_now,
        updated_at = v_now
  RETURNING * INTO r;

  -- If already locked, deny without bumping the lock further.
  IF r.locked_until IS NOT NULL AND r.locked_until > v_now THEN
    allowed := false;
    attempts := r.attempts;
    locked_until := r.locked_until;
    reason := 'locked';
    RETURN NEXT;
    RETURN;
  END IF;

  new_attempts := r.attempts;
  new_lock := NULL;

  IF new_attempts >= 12 THEN
    new_lock := v_now + interval '24 hours';
  ELSIF new_attempts >= 8 THEN
    new_lock := v_now + interval '1 hour';
  ELSIF new_attempts >= 5 THEN
    new_lock := v_now + interval '15 minutes';
  ELSIF new_attempts >= 3 THEN
    new_lock := v_now + interval '1 minute';
  END IF;

  IF new_lock IS NOT NULL THEN
    UPDATE public.auth_rate_limits
       SET locked_until = new_lock, updated_at = v_now
     WHERE id = r.id;
    allowed := false;
    attempts := new_attempts;
    locked_until := new_lock;
    reason := 'rate_limited';
    RETURN NEXT;
    RETURN;
  END IF;

  allowed := true;
  attempts := new_attempts;
  locked_until := NULL;
  reason := 'ok';
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_record_rate_limit(text,text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_record_rate_limit(text,text,text,integer) TO service_role;

-- ============================================================
-- clear_rate_limit — call after a SUCCESSFUL action so legit
-- users aren't penalized.
-- ============================================================
CREATE OR REPLACE FUNCTION public.clear_rate_limit(
  _key_type text,
  _key_value text,
  _action text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.auth_rate_limits
   WHERE key_type = _key_type AND key_value = _key_value AND action = _action;
$$;

REVOKE ALL ON FUNCTION public.clear_rate_limit(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_rate_limit(text,text,text) TO service_role;
