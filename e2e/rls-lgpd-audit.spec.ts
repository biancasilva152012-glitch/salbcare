import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

test.describe("RLS / LGPD audit safeguards", () => {
  test("anonymous cannot read pii_access_log", async () => {
    const c = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await c.from("pii_access_log").select("*").limit(1);
    expect(error || (data?.length ?? 0) === 0).toBeTruthy();
  });

  test("anonymous cannot call log_pii_view", async () => {
    const c = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await c.rpc("log_pii_view", {
      _resource_table: "patients",
      _resource_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  test("anonymous cannot call get_pii_access_logs", async () => {
    const c = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await c.rpc("get_pii_access_logs", { _limit: 1 });
    expect(error).not.toBeNull();
  });

  test("anonymous cannot insert arbitrary email into ambassador_waitlist", async () => {
    const c = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await c.from("ambassador_waitlist").insert({
      email: `evil-${Date.now()}@attacker.example`,
    });
    expect(error).not.toBeNull();
  });
});
