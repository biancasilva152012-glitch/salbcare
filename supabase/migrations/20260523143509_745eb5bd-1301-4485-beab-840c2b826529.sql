
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. platform_settings: restrict SELECT to admins only.
--    Only the admin Settings page reads this table; making it
--    admin-only prevents future internal flags from leaking to
--    all authenticated professionals.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read platform_settings" ON public.platform_settings;

CREATE POLICY "Admins can read platform_settings"
  ON public.platform_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ─────────────────────────────────────────────────────────────
-- 2. Trigger-only SECURITY DEFINER helpers: revoke EXECUTE from
--    anon/authenticated/public. These are invoked by triggers
--    only and must never be callable via PostgREST RPC.
-- ─────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()       FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_profile_slug()          FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_premium_block_attempt() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_premium_route_block()   FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_redirect_audit_event()  FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_and_apply_suspension(uuid) FROM anon, authenticated, public;

-- ─────────────────────────────────────────────────────────────
-- 3. Admin-only RPCs: revoke from anon (they self-check via
--    has_role, but defense in depth — keep callable by
--    authenticated since the function itself raises 'forbidden'
--    for non-admins).
-- ─────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.get_partners_with_stats()        FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_partner_referrals(text)      FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_rls_policies_for_table(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.audit_rls_coverage()             FROM anon, public;

-- ─────────────────────────────────────────────────────────────
-- 4. RLS helper functions: revoke EXECUTE from anon. They must
--    remain callable by authenticated since RLS expressions run
--    as the calling role.
-- ─────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)       FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_contador(uuid)     FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_active_paid_plan(uuid)     FROM anon, public;

-- ─────────────────────────────────────────────────────────────
-- 5. merge_demo_counters: authenticated-only (requires auth.uid()
--    internally), revoke from anon.
-- ─────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.merge_demo_counters(text) FROM anon, public;

-- ─────────────────────────────────────────────────────────────
-- NOTE — Intentional public RPCs (kept callable by anon):
--   get_public_professionals, get_public_salbscore_by_slug,
--   get_public_profile_by_slug, verify_document_by_hash,
--   verify_salbscore_document_by_hash, get_partner_by_slug,
--   get_ambassador_spots_taken, increment_qr_scan,
--   check_email_user_type, check_rls_health,
--   check_salbscore_security_health
-- These serve the public marketing/directory/verification flows.
-- ─────────────────────────────────────────────────────────────
