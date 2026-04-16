DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  trial_end timestamptz := now() + interval '30 days';
BEGIN
  DELETE FROM auth.users WHERE email = 'livio@nymu.com';
  DELETE FROM public.profiles WHERE email = 'livio@nymu.com';
  DELETE FROM public.professionals WHERE email = 'livio@nymu.com';

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'livio@nymu.com',
    '$2b$10$oWlwk5r.K3Qj4J3tDKa/k.OazSZfEii1pHUlGBl89P/3IqP80nSlK',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Livio Demo","user_type":"professional","professional_type":"medico"}'::jsonb,
    'authenticated', 'authenticated',
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', 'livio@nymu.com', 'email_verified', true),
    'email', new_user_id::text, now(), now(), now()
  );

  -- O trigger handle_new_user já criou o profile; só atualizamos
  UPDATE public.profiles SET
    plan = 'essencial',
    payment_status = 'trialing',
    verification_status = 'approved',
    trial_start_date = now(),
    council_number = '000000',
    council_state = 'SP',
    bio = 'Conta de demonstração para exploração da plataforma SalbCare.'
  WHERE user_id = new_user_id;

  INSERT INTO public.professionals (
    user_id, name, email, specialty, status, plan, subscription_status, trial_ends_at
  ) VALUES (
    new_user_id, 'Livio Demo', 'livio@nymu.com', 'medico', 'active',
    'essencial', 'trialing', trial_end
  );
END $$;