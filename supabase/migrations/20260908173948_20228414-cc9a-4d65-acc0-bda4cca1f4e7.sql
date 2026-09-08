REVOKE EXECUTE ON FUNCTION public.get_professional_payment_info(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_professional_payment_info(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_professional_payment_info(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_professional_payment_info(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.is_privileged_writer()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text;
BEGIN
  BEGIN
    jwt_role := coalesce(current_setting('request.jwt.claim.role', true), (current_setting('request.jwt.claims', true)::json ->> 'role'));
  EXCEPTION WHEN others THEN
    jwt_role := NULL;
  END;

  IF jwt_role IS NULL OR jwt_role = 'service_role' THEN
    RETURN true;
  END IF;

  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_professionals_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_writer() THEN
    RETURN NEW;
  END IF;

  NEW.plan := OLD.plan;
  NEW.billing := OLD.billing;
  NEW.subscription_status := OLD.subscription_status;
  NEW.subscription_id := OLD.subscription_id;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_professionals_billing_fields ON public.professionals;
CREATE TRIGGER guard_professionals_billing_fields
BEFORE UPDATE ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.guard_professionals_billing_fields();

CREATE OR REPLACE FUNCTION public.guard_profiles_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_writer() THEN
    RETURN NEW;
  END IF;

  NEW.plan := OLD.plan;
  NEW.payment_status := OLD.payment_status;
  NEW.verification_status := OLD.verification_status;
  NEW.directory_grandfathered := OLD.directory_grandfathered;
  NEW.stripe_account_id := OLD.stripe_account_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profiles_billing_fields ON public.profiles;
CREATE TRIGGER guard_profiles_billing_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_billing_fields();