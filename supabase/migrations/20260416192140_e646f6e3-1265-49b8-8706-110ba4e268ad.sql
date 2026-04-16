UPDATE auth.users
SET 
  encrypted_password = '$2b$10$f4XDPAkDzyQ10iB52SMOFOKRsLzpKxcIDvsinOxDJfIcDvUeBuMDS',
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email = 'biancadealbuquerquep@gmail.com';