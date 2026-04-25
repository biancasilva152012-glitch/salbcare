-- 1) Helper: verifica se o usuário tem plano pago/ativo (ou está em trial válido)
CREATE OR REPLACE FUNCTION public.has_active_paid_plan(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND (
        p.payment_status IN ('active', 'trialing', 'paid')
        OR (
          p.trial_start_date IS NOT NULL
          AND p.trial_start_date > (now() - interval '7 days')
        )
      )
  )
  OR public.has_role(_user_id, 'admin'::app_role)
  OR public.has_role(_user_id, 'contador'::app_role);
$$;

-- 2) Diretório público: só mostra profissionais com plano ativo/pago
CREATE OR REPLACE FUNCTION public.get_public_professionals(specialty_filter text DEFAULT NULL::text)
RETURNS TABLE(available_hours json, avatar_url text, card_link text, consultation_price numeric, council_number text, council_state text, crm text, interval_minutes integer, meet_link text, min_advance_hours integer, name text, pix_key text, professional_type text, slot_duration integer, user_id uuid, bio text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.available_hours::json,
    p.avatar_url,
    p.card_link,
    p.consultation_price,
    p.council_number,
    p.council_state,
    p.crm,
    p.interval_minutes,
    p.meet_link,
    p.min_advance_hours,
    p.name,
    p.pix_key,
    p.professional_type,
    p.slot_duration,
    p.user_id,
    p.bio,
    p.phone
  FROM profiles p
  WHERE p.user_type = 'professional'
    AND p.name NOT ILIKE '%teste%'
    AND p.name NOT ILIKE '%test%'
    AND p.name NOT ILIKE '%demo%'
    AND p.email NOT ILIKE '%teste@%'
    AND p.email NOT ILIKE '%test@%'
    AND p.email NOT ILIKE '%demo%'
    AND p.email <> 'livio@nymu.com'
    AND p.email <> 'biancadealbuquerquep@gmail.com'
    AND p.payment_status IN ('active', 'trialing', 'paid')
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.user_id AND ur.role = 'admin'
    )
    AND (specialty_filter IS NULL OR p.professional_type = specialty_filter);
$$;

-- 3) Backend RLS: prescrições/atestados digitais só para plano pago
DROP POLICY IF EXISTS "Users can insert own documents" ON public.digital_documents;
CREATE POLICY "Paid users can insert own documents"
ON public.digital_documents
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_active_paid_plan(auth.uid())
);

-- 4) Backend RLS: teleconsultas só podem ser criadas por plano pago
DROP POLICY IF EXISTS "Users can insert own teleconsultations" ON public.teleconsultations;
CREATE POLICY "Paid users can insert own teleconsultations"
ON public.teleconsultations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_active_paid_plan(auth.uid())
);