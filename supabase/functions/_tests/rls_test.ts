// RLS regression tests — runs as anonymous (anon key) and asserts that:
//   1. PII tables deny SELECT/INSERT to anon.
//   2. Admin-only RPCs reject non-admin callers with "forbidden".
//   3. Public RPCs (SECURITY DEFINER curated views) succeed for anon.
//
// Run via: supabase--test_edge_functions
// These tests do not require service-role keys — they intentionally exercise
// the public attack surface (anon role only).

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Tables holding PII or financial data — anon must NEVER read or write them.
const PII_TABLES = [
  "patients",
  "appointments",
  "medical_records",
  "financial_transactions",
  "invoices",
  "teleconsultations",
  "digital_documents",
  "patient_documents",
  "consultation_payments",
  "pii_access_log",
  "kite_bookings",
  "kite_booking_events",
  "lgpd_subject_requests",
  "admin_logs",
  "user_roles",
] as const;

for (const table of PII_TABLES) {
  Deno.test(`anon cannot SELECT from ${table}`, async () => {
    const { data, error } = await anon.from(table).select("*").limit(1);
    // Either RLS returns empty array (no permission grants matching), or a permission error.
    // What must NEVER happen: returning actual rows.
    assertEquals(
      data == null || data.length === 0,
      true,
      `anon read leak on ${table}: ${JSON.stringify(data)} / err=${error?.message}`,
    );
  });

  Deno.test(`anon cannot INSERT into ${table}`, async () => {
    const { error } = await anon.from(table).insert({ id: crypto.randomUUID() } as never);
    assert(error, `anon INSERT into ${table} should fail but succeeded`);
  });
}

// Admin-only RPCs — must reject anon with a "forbidden" / permission error.
const ADMIN_RPCS: Array<{ fn: string; args: Record<string, unknown> }> = [
  { fn: "get_pii_access_logs", args: { _limit: 1 } },
  { fn: "audit_rls_coverage", args: {} },
  { fn: "verify_pii_access_log_chain", args: { _limit: 10 } },
  { fn: "get_lgpd_requests", args: {} },
  { fn: "export_lgpd_subject_data", args: { _subject_user_id: "00000000-0000-0000-0000-000000000000" } },
  { fn: "purge_pii_access_log", args: { _retention_days: 1825 } },
  { fn: "get_partners_with_stats", args: {} },
  { fn: "get_rls_policies_for_table", args: { _table: "patients" } },
];

for (const { fn, args } of ADMIN_RPCS) {
  Deno.test(`anon is rejected by admin RPC ${fn}`, async () => {
    const { data, error } = await anon.rpc(fn, args);
    // Acceptable: explicit "forbidden" RAISE, or empty result (e.g. partners list filters by has_role).
    // What must NEVER happen: non-empty data leaked to anon.
    const leaked = Array.isArray(data) ? data.length > 0 : data != null && data !== false;
    assertEquals(
      leaked,
      false,
      `anon got data from admin RPC ${fn}: ${JSON.stringify(data)} (error: ${error?.message ?? "none"})`,
    );
  });
}

// Public RPCs — must succeed for anon (curated SECURITY DEFINER views).
const PUBLIC_RPCS: Array<{ fn: string; args: Record<string, unknown> }> = [
  { fn: "get_public_professionals", args: {} },
  { fn: "verify_document_by_hash", args: { _hash: "non-existent-hash" } },
  { fn: "get_partner_public_info", args: { _slug: "nonexistent" } },
];

for (const { fn, args } of PUBLIC_RPCS) {
  Deno.test(`anon can call public RPC ${fn}`, async () => {
    const { error } = await anon.rpc(fn, args);
    assertEquals(error, null, `public RPC ${fn} failed for anon: ${error?.message}`);
  });
}

// RLS health probe — overall_ok must be true, no failing tables.
Deno.test("check_rls_health reports all tables healthy", async () => {
  const { data, error } = await anon.rpc("check_rls_health");
  assertEquals(error, null, `check_rls_health failed: ${error?.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  assertEquals(row?.overall_ok, true, `failing tables: ${JSON.stringify(row?.failing_tables)}`);
});
