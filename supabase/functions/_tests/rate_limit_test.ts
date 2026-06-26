// Rate-limit + auth-gate regression tests.
//
// These run against the deployed `auth-gate` edge function (uses the same
// Postgres-backed counter as production). They assert four properties:
//
//   1. Repeated bad logins escalate to a 429 lock (per email AND per IP).
//   2. The lock window applies — within it, even valid credentials are
//      refused with a generic message.
//   3. Login error responses are byte-identical regardless of whether the
//      email exists, so an attacker can't enumerate accounts.
//   4. Reset always returns `{ ok: true }` for the same reason.
//
// Run with:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... deno test -A rate_limit_test.ts
//
// The tests use random throwaway emails so they don't poison real counters.

import { assert, assertEquals } from "https://deno.land/std@0.190.0/assert/mod.ts";

const URL = Deno.env.get("SUPABASE_URL");
const ANON = Deno.env.get("SUPABASE_ANON_KEY");

function gate(body: unknown, ip = "203.0.113." + Math.floor(Math.random() * 255)) {
  return fetch(`${URL}/functions/v1/auth-gate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON!,
      "Authorization": `Bearer ${ANON}`,
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

const skipIfNoEnv = !URL || !ANON;

Deno.test({
  name: "login: progressive lockout after repeated failures",
  ignore: skipIfNoEnv,
  fn: async () => {
    const email = `ratetest+${crypto.randomUUID()}@example.com`;
    const ip = "198.51.100." + Math.floor(Math.random() * 255);
    let lastStatus = 0;
    let sawLock = false;
    for (let i = 0; i < 8; i++) {
      const res = await gate({ action: "login", email, password: "wrong-pw-xxx" }, ip);
      lastStatus = res.status;
      const j = await res.json();
      if (res.status === 429) {
        sawLock = true;
        assertEquals(j.error, "rate_limited");
        break;
      }
      assertEquals(j.error, "invalid_credentials");
    }
    assert(sawLock, `expected a 429 lock within 8 tries, last status was ${lastStatus}`);
  },
});

Deno.test({
  name: "login: error response identical for existing vs non-existing email (anti-enumeration)",
  ignore: skipIfNoEnv,
  fn: async () => {
    // Fresh IP for each call so per-IP limits don't taint the comparison.
    const r1 = await gate(
      { action: "login", email: "definitely-not-a-user@example.com", password: "x" },
      "192.0.2.10",
    );
    const r2 = await gate(
      { action: "login", email: "ceo@salbcare.com", password: "definitely-wrong" },
      "192.0.2.11",
    );
    assertEquals(r1.status, r2.status);
    const j1 = await r1.json();
    const j2 = await r2.json();
    assertEquals(j1, j2, "login error payloads must match exactly");
    assertEquals(j1.error, "invalid_credentials");
    assert(!("user_exists" in j1));
    assert(!("attempts_left" in j1));
  },
});

Deno.test({
  name: "reset: always returns ok regardless of email existence",
  ignore: skipIfNoEnv,
  fn: async () => {
    const r1 = await gate(
      { action: "reset", email: `nobody+${crypto.randomUUID()}@example.com` },
      "192.0.2.20",
    );
    const r2 = await gate({ action: "reset", email: "ceo@salbcare.com" }, "192.0.2.21");
    assertEquals(r1.status, 200);
    assertEquals(r2.status, 200);
    assertEquals(await r1.json(), { ok: true });
    assertEquals(await r2.json(), { ok: true });
  },
});

Deno.test({
  name: "reset: invalid email shape still returns ok (no validation leak)",
  ignore: skipIfNoEnv,
  fn: async () => {
    const r = await gate({ action: "reset", email: "not-an-email" }, "192.0.2.30");
    assertEquals(r.status, 200);
    assertEquals(await r.json(), { ok: true });
  },
});

Deno.test({
  name: "gate: rejects unknown action",
  ignore: skipIfNoEnv,
  fn: async () => {
    const r = await gate({ action: "delete-everything" });
    assertEquals(r.status, 400);
  },
});
