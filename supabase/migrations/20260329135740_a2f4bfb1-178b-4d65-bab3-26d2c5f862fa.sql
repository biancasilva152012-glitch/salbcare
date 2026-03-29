
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS plan text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS billing text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS had_trial boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_updated_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT NULL;
