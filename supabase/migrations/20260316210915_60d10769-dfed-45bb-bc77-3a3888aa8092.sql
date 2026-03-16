
-- Add stripe_account_id and stripe_onboarding_complete to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false;
