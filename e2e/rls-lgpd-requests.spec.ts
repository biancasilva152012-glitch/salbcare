import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

test.describe("LGPD audit immutability & subject requests", () => {
  test("anonymous cannot call verify_pii_access_log_chain", async () => {
    const c = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await c.rpc("verify_pii_access_log_chain", { _limit: 10 } as any);
    expect(error).not.toBeNull();
  });

  test("anonymous cannot call purge_pii_access_log", async () => {
    const c = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await c.rpc("purge_pii_access_log", { _retention_days: 365 } as any);
    expect(error).not.toBeNull();
  });

  test("anonymous cannot call export_lgpd_subject_data", async () => {
    const c = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await c.rpc("export_lgpd_subject_data", {
      _subject_user_id: "00000000-0000-0000-0000-000000000000",
    } as any);
    expect(error).not.toBeNull();
  });

  test("anonymous cannot list lgpd_subject_requests", async () => {
    const c = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await c.from("lgpd_subject_requests").select("*").limit(1);
    expect(error || (data?.length ?? 0) === 0).toBeTruthy();
  });

  test("anonymous cannot insert into lgpd_subject_requests", async () => {
    const c = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await c.from("lgpd_subject_requests").insert({
      request_type: "access",
      subject_email: "x@x.com",
    } as any);
    expect(error).not.toBeNull();
  });
});
