-- 1) Assinaturas Pro
CREATE TABLE public.pro_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pro_subscriptions TO authenticated;
GRANT ALL ON public.pro_subscriptions TO service_role;

ALTER TABLE public.pro_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own pro subscription"
  ON public.pro_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all pro subscriptions"
  ON public.pro_subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_pro_subscriptions_updated_at
  BEFORE UPDATE ON public.pro_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Helper: assinatura Pro ativa
CREATE OR REPLACE FUNCTION public.has_active_pro(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.pro_subscriptions s
    WHERE s.user_id = _user_id
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_active_pro(uuid) TO authenticated, service_role;

-- 3) Agenda Pro (v1: criação manual pelo profissional)
CREATE TABLE public.pro_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_name text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  service text,
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_appointments TO authenticated;
GRANT ALL ON public.pro_appointments TO service_role;

ALTER TABLE public.pro_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pro appointments"
  ON public.pro_appointments FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX pro_appointments_user_time_idx
  ON public.pro_appointments (user_id, scheduled_at DESC);

CREATE TRIGGER update_pro_appointments_updated_at
  BEFORE UPDATE ON public.pro_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Vitrine: dono + publicação + campos profissionais
ALTER TABLE public.local_partners
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}';

-- Parceiros curados existentes continuam visíveis
UPDATE public.local_partners SET is_published = true WHERE owner_user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS local_partners_owner_unique
  ON public.local_partners (owner_user_id) WHERE owner_user_id IS NOT NULL;

CREATE POLICY "Pro owners read own partner card"
  ON public.local_partners FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Pro owners create own partner card"
  ON public.local_partners FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id AND public.has_active_pro(auth.uid()));

CREATE POLICY "Pro owners update own partner card"
  ON public.local_partners FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);