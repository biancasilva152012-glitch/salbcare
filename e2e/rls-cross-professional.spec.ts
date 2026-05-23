import { test, expect } from "@playwright/test";
import { fetchTestSession, requireTestUser } from "./helpers/auth";

/**
 * RLS — Cross-professional isolation
 *
 * Verifica que um profissional autenticado (E2E_USER_*) NÃO consegue ler
 * registros de OUTROS profissionais via PostgREST direto (mesmo sabendo
 * a anon key + tendo um JWT válido).
 *
 * A policy correta é `auth.uid() = user_id`: qualquer SELECT sem filtro
 * deve retornar somente as linhas do próprio profissional. Tentativas de
 * UPDATE/DELETE em linhas de outros devem afetar 0 linhas.
 *
 * Skipa automaticamente quando E2E_USER_EMAIL/PASSWORD não estão setados.
 */

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://fevrdqmqmbahmeaymplq.supabase.co";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldnJkcW1xbWJhaG1lYXltcGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDYxMzcsImV4cCI6MjA4ODkyMjEzN30.Dq924zxY5yShQuiAxE7_qBTOYML3gpvNqOBqckyzNmI";

requireTestUser(test);

const PII_TABLES_WITH_USER_ID = [
  "patients",
  "appointments",
  "medical_records",
  "teleconsultations",
  "invoices",
  "financial_transactions",
  "digital_documents",
  "patient_documents",
  "exam_requests",
  "mentorship_messages",
] as const;

async function authedHeaders() {
  const session = await fetchTestSession();
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

test.describe("RLS — authed user only sees own rows", () => {
  for (const table of PII_TABLES_WITH_USER_ID) {
    test(`SELECT on ${table} returns only own user_id rows`, async ({ request }) => {
      const headers = await authedHeaders();
      const session = await fetchTestSession();
      const myId = (session.user as { id: string }).id;

      const res = await request.get(
        `${SUPABASE_URL}/rest/v1/${table}?select=user_id&limit=200`,
        { headers },
      );
      expect(res.ok(), `${table}: ${res.status()}`).toBeTruthy();
      const rows = (await res.json()) as Array<{ user_id: string }>;
      // Não vaza linhas de outros profissionais — todas devem ser minhas.
      for (const r of rows) {
        expect(r.user_id, `${table}: leaked row from ${r.user_id}`).toBe(myId);
      }
    });
  }

  test("UPDATE on another user's patient row affects 0 rows", async ({ request }) => {
    const headers = await authedHeaders();
    const FAKE_OTHER_USER = "00000000-0000-0000-0000-000000000042";
    const res = await request.patch(
      `${SUPABASE_URL}/rest/v1/patients?user_id=eq.${FAKE_OTHER_USER}`,
      { headers, data: { notes: "hijack-attempt" } },
    );
    // RLS deve filtrar — resposta 200/204 mas array vazio.
    if (res.ok()) {
      const body = await res.json().catch(() => []);
      expect(Array.isArray(body) ? body.length : 0).toBe(0);
    } else {
      expect([401, 403, 404]).toContain(res.status());
    }
  });

  test("Authed non-admin cannot read partners.contact_email", async ({ request }) => {
    const headers = await authedHeaders();
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/partners?select=contact_email,contact_name&limit=5`,
      { headers },
    );
    // RLS de partners é admin-only — sem role admin devolve 0 linhas.
    if (res.ok()) {
      const rows = await res.json();
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBe(0);
    } else {
      expect([401, 403]).toContain(res.status());
    }
  });

  test("Authed user cannot read other users' profiles via /profiles", async ({
    request,
  }) => {
    const headers = await authedHeaders();
    const session = await fetchTestSession();
    const myId = (session.user as { id: string }).id;
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/profiles?select=user_id,email&limit=100`,
      { headers },
    );
    expect(res.ok()).toBeTruthy();
    const rows = (await res.json()) as Array<{ user_id: string }>;
    for (const r of rows) {
      expect(r.user_id, `leaked profile ${r.user_id}`).toBe(myId);
    }
  });
});
