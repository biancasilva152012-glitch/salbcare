-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'contador', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Helper: check if user is admin or contador
CREATE OR REPLACE FUNCTION public.is_admin_or_contador(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'contador')
  )
$$;

-- 6. RLS policies for user_roles table
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin_or_contador(auth.uid()));

-- 7. Allow admins to read ALL profiles (for admin dashboard)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin_or_contador(auth.uid()));

-- 8. Allow admins to update ANY profile (for approving subscriptions, suspending)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin_or_contador(auth.uid()));

-- 9. Allow admins to view ALL cnpj_requests
CREATE POLICY "Admins can view all cnpj_requests"
ON public.cnpj_requests
FOR SELECT
TO authenticated
USING (public.is_admin_or_contador(auth.uid()));

-- 10. Allow admins to update ALL cnpj_requests
CREATE POLICY "Admins can update all cnpj_requests"
ON public.cnpj_requests
FOR UPDATE
TO authenticated
USING (public.is_admin_or_contador(auth.uid()));

-- 11. Storage: allow admins to view payment receipts
CREATE POLICY "Admins can view payment receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts'
  AND public.is_admin_or_contador(auth.uid())
);