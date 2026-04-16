INSERT INTO public.user_roles (user_id, role) 
VALUES ('6752e20f-a63b-43c1-ac88-8c35cb567807', 'admin') 
ON CONFLICT (user_id, role) DO NOTHING;