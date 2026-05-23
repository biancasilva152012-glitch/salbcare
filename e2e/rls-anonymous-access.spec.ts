import { test, expect } from "@playwright/test";

/**
 * RLS — Garante que clientes anônimos (apenas anon key, sem JWT) NÃO leem
 * nem gravam em nenhuma tabela com PII de paciente/profissional.
 *
 * Tabelas cobertas (todas devem retornar 0 linhas em SELECT e 401/403 em
 * INSERT direto via PostgREST):
 *   - patients, appointments, medical_records, teleconsultations
 *   - invoices, financial_transactions, digital_documents, patient_documents
 *   - consultation_payments, exam_requests, mentorship_messages, chat_messages
 *   - profiles
 *
 * Cobre o requisito LGPD: "nenhum visitante anônimo vê PII de paciente
 * mesmo conhecendo URL/anon key públicas".
 */

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://fevrdqmqmbahmeaymplq.supabase.co";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldnJkcW1xbWJhaG1lYXltcGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDYxMzcsImV4cCI6MjA4ODkyMjEzN30.Dq924zxY5yShQuiAxE7_qBTOYML3gpvNqOBqckyzNmI";

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const PII_TABLES = [
  "patients",
  "appointments",
  "medical_records",
  "teleconsultations",
  "invoices",
  "financial_transactions",
  "digital_documents",
  "patient_documents",
  "consultation_payments",
  "exam_requests",
  "mentorship_messages",
  "chat_messages",
  "profiles",
] as const;

test.describe("RLS — anonymous read access is blocked on all PII tables", () => {
  for (const table of PII_TABLES) {
    test(`anon cannot read ${table}`, async ({ request }) => {
      const res = await request.get(
        `${SUPABASE_URL}/rest/v1/${table}?select=id&limit=5`,
        { headers },
      );
      // Aceitável: 200 com array vazio (RLS filtra) OU 401/403.
      // PROIBIDO: 200 com linhas reais.
      if (res.ok()) {
        const rows = await res.json();
        expect(Array.isArray(rows), `${table}: response should be array`).toBe(true);
        expect(rows.length, `${table}: anon must not see any rows`).toBe(0);
      } else {
        expect([401, 403]).toContain(res.status());
      }
    });
  }
});

const FAKE_USER = "00000000-0000-0000-0000-000000000099";

test.describe("RLS — anonymous writes are blocked on PII tables", () => {
  test("anon cannot INSERT into patients", async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/patients`, {
      headers,
      data: { user_id: FAKE_USER, name: "anon-bypass" },
    });
    expect(res.ok()).toBeFalsy();
    expect([401, 403]).toContain(res.status());
  });

  test("anon cannot INSERT into appointments", async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/appointments`, {
      headers,
      data: {
        user_id: FAKE_USER,
        patient_name: "anon",
        date: "2030-01-01",
        time: "10:00",
      },
    });
    expect(res.ok()).toBeFalsy();
    expect([401, 403]).toContain(res.status());
  });

  test("anon cannot INSERT into medical_records", async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/medical_records`, {
      headers,
      data: { user_id: FAKE_USER, patient_name: "anon" },
    });
    expect(res.ok()).toBeFalsy();
    expect([401, 403]).toContain(res.status());
  });

  test("anon cannot INSERT into financial_transactions", async ({ request }) => {
    const res = await request.post(
      `${SUPABASE_URL}/rest/v1/financial_transactions`,
      {
        headers,
        data: { user_id: FAKE_USER, amount: 100, description: "x", type: "income" },
      },
    );
    expect(res.ok()).toBeFalsy();
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("Field-level — partner contact PII is not exposed to anon", () => {
  test("anon cannot read partners.contact_email", async ({ request }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/partners?select=contact_email,contact_name,slug&limit=5`,
      { headers },
    );
    if (res.ok()) {
      const rows = await res.json();
      expect(Array.isArray(rows)).toBe(true);
      // Sem admin role o RLS deve filtrar tudo.
      expect(rows.length).toBe(0);
    } else {
      expect([401, 403]).toContain(res.status());
    }
  });

  test("get_partner_public_info RPC never returns contact_email", async ({
    request,
  }) => {
    const res = await request.post(
      `${SUPABASE_URL}/rest/v1/rpc/get_partner_public_info`,
      { headers, data: { _slug: "nymu" } },
    );
    // Pode retornar [] se o slug não existe; o crítico é o shape.
    const body = await res.json().catch(() => []);
    if (Array.isArray(body) && body.length > 0) {
      for (const row of body) {
        expect(row).not.toHaveProperty("contact_email");
        expect(row).not.toHaveProperty("contact_name");
      }
    }
  });
});
