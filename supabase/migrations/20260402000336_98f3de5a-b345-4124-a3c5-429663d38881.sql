
-- Set trial for Andressa
UPDATE public.professionals 
SET subscription_status = 'trialing', 
    trial_ends_at = now() + interval '7 days',
    had_trial = true
WHERE user_id = 'ebc4f8cd-f912-40f3-aea1-71d83c402964';

-- Set trial for Vitória
UPDATE public.professionals 
SET subscription_status = 'trialing', 
    trial_ends_at = now() + interval '7 days',
    had_trial = true
WHERE user_id = 'e34e0b65-990e-4316-8bef-4daa5aa0a9da';

-- Enable online visibility for both
UPDATE public.profiles 
SET availability_online = true
WHERE user_id IN ('ebc4f8cd-f912-40f3-aea1-71d83c402964', 'e34e0b65-990e-4316-8bef-4daa5aa0a9da');
