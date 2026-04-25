import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  resolveSafePath,
  safeRedirectUrl,
  ALLOWED_REDIRECTS,
  FALLBACK_PATH,
} from "./safeRedirect.ts";

const APP_ORIGIN = "https://app.example.com";

Deno.test("returns FALLBACK_PATH when no candidates are provided", () => {
  const r = resolveSafePath({ candidates: [] });
  assertEquals(r.path, FALLBACK_PATH);
  assertEquals(r.reason, "fallback-empty");
  assertEquals(r.changed, false);
});

Deno.test("accepts a single allowed path", () => {
  const r = resolveSafePath({ candidates: ["/dashboard/agenda"] });
  assertEquals(r.path, "/dashboard/agenda");
  assertEquals(r.reason, "ok");
});

Deno.test("rejects path-traversal in any form", () => {
  for (const bad of [
    "/dashboard/../admin",
    "/dashboard%2F..%2Fadmin",
    "/dashboard%2fadmin",
    "/dashboard\\admin",
    "..",
  ]) {
    const r = resolveSafePath({ candidates: [bad] });
    assertEquals(r.path, FALLBACK_PATH, `expected fallback for ${bad}`);
    assertEquals(r.reason, "fallback-traversal");
  }
});

Deno.test("rejects external schemes and protocol-relative URLs", () => {
  for (const bad of [
    "//evil.com",
    "javascript:alert(1)",
    "data:text/html,<script>",
    "mailto:a@b.com",
    "https://evil.com/dashboard/agenda",
  ]) {
    const r = resolveSafePath({ candidates: [bad] });
    assertEquals(r.path, FALLBACK_PATH, `expected fallback for ${bad}`);
    assert(
      r.reason === "fallback-external-origin" ||
        r.reason === "fallback-disallowed",
      `unexpected reason ${r.reason} for ${bad}`,
    );
  }
});

Deno.test("accepts absolute URL when origin is allowlisted", () => {
  const r = resolveSafePath({
    candidates: [`${APP_ORIGIN}/dashboard/agenda?utm_source=x`],
    allowedOrigins: [APP_ORIGIN],
  });
  assertEquals(r.reason, "ok");
  assertEquals(r.path, "/dashboard/agenda?utm_source=x");
});

Deno.test("rejects absolute URL with allowed origin but disallowed path", () => {
  const r = resolveSafePath({
    candidates: [`${APP_ORIGIN}/admin/users`],
    allowedOrigins: [APP_ORIGIN],
  });
  assertEquals(r.path, FALLBACK_PATH);
  assertEquals(r.reason, "fallback-disallowed");
});

Deno.test("multiple candidates resolving to the SAME allowed path is OK", () => {
  const r = resolveSafePath({
    candidates: ["/dashboard/agenda", "/dashboard/agenda"],
  });
  assertEquals(r.reason, "ok");
  assertEquals(r.path, "/dashboard/agenda");
});

Deno.test("multiple candidates with DIFFERENT allowed paths is ambiguous", () => {
  const r = resolveSafePath({
    candidates: ["/dashboard/agenda", "/dashboard/pacientes"],
  });
  assertEquals(r.path, FALLBACK_PATH);
  assertEquals(r.reason, "fallback-ambiguous");
  assertEquals(r.changed, true);
});

Deno.test("safeRedirectUrl produces absolute URL based on baseOrigin", () => {
  const { url, result } = safeRedirectUrl({
    baseOrigin: APP_ORIGIN,
    candidates: ["/dashboard/agenda"],
  });
  assertEquals(result.reason, "ok");
  assertEquals(url, `${APP_ORIGIN}/dashboard/agenda`);
});

Deno.test("safeRedirectUrl falls back when input is hostile", () => {
  const { url, result } = safeRedirectUrl({
    baseOrigin: APP_ORIGIN,
    candidates: ["https://evil.com/dashboard"],
  });
  assertEquals(result.path, FALLBACK_PATH);
  assertEquals(url, `${APP_ORIGIN}${FALLBACK_PATH}`);
});

Deno.test("ALLOWED_REDIRECTS is non-empty and starts with /", () => {
  assert(ALLOWED_REDIRECTS.length > 0);
  for (const p of ALLOWED_REDIRECTS) {
    assert(p.startsWith("/"));
    assert(!p.includes(".."));
  }
});
