-- Restrict EXECUTE on SECURITY DEFINER functions to roles that actually need them.
-- Revoke from PUBLIC (which silently grants both anon + authenticated) and re-grant
-- explicitly to the role(s) that should be able to call each function.

-- ── Anonymous-callable (truly public APIs) ───────────────────────────
-- These are intentionally exposed without auth.
REVOKE EXECUTE ON FUNCTION public.get_public_professionals(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_professionals(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_profile_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_slug(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_partner_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_partner_by_slug(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.verify_document_by_hash(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_document_by_hash(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.check_email_user_type(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_email_user_type(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.merge_demo_counters(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merge_demo_counters(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_ambassador_spots_taken() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ambassador_spots_taken() TO anon, authenticated;

-- ── Authenticated-only ──────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin_or_contador(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_contador(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_active_paid_plan(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_paid_plan(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.check_and_apply_suspension(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_apply_suspension(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_partner_referrals(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_partner_referrals(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_partners_with_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_partners_with_stats() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.audit_rls_coverage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.audit_rls_coverage() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.check_rls_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rls_health() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_rls_policies_for_table(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rls_policies_for_table(text) TO authenticated;

-- ── Internal trigger / helper functions (no API exposure needed) ────
-- These should never be called via PostgREST.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_profile_slug() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_redirect_audit_event() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_premium_block_attempt() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_premium_route_block() FROM PUBLIC;