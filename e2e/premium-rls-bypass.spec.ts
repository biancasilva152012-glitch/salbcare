import { test, expect } from "@playwright/test";

/**
 * Premium RLS bypass — usuários sem plano ativo NÃO podem inserir em
 * `teleconsultations` nem em `digital_documents`, mesmo via requests
 * diretas à PostgREST (sem passar pela UI).
 *
 * Estratégia: usamos a anon key (sem JWT) — equivalente ao pior caso de
 * um atacante que descobriu a URL/key públicas e tenta inserir direto.
 * As policies INSERT exigem `auth.uid() = user_id AND has_active_paid_plan(...)`,
 * portanto SEM JWT a inserção precisa falhar (auth.uid() é NULL).
 *
 * Cobre o requisito: "backend bloqueia com RLS mesmo sem usar a UI".
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

const FAKE_USER = "00000000-0000-0000-0000-000000000001";

test.describe("RLS premium — inserts diretos sem plano são bloqueados", () => {
  test("INSERT em teleconsultations sem JWT é bloqueado", async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/teleconsultations`, {
      headers,
      data: {
        user_id: FAKE_USER,
        patient_name: "Bypass test",
        date: new Date().toISOString(),
        status: "scheduled",
      },
    });
    // PostgREST retorna 401/403 quando a policy INSERT bloqueia.
    expect(res.ok()).toBeFalsy();
    expect([401, 403]).toContain(res.status());
    const body = await res.json().catch(() => ({}));
    // mensagem típica do Postgres / PostgREST p/ violação de RLS
    const msg = JSON.stringify(body).toLowerCase();
    expect(
      msg.includes("row-level security") ||
        msg.includes("row level security") ||
        msg.includes("permission denied") ||
        msg.includes("jwt") ||
        msg.includes("not authorized"),
    ).toBeTruthy();
  });

  test("INSERT em digital_documents sem JWT é bloqueado", async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/digital_documents`, {
      headers,
      data: {
        user_id: FAKE_USER,
        patient_name: "Bypass test",
        professional_name: "Bypass",
        professional_type: "medico",
        document_type: "prescription",
        hash_code: "bypass-test-hash",
        signed_icp: false,
      },
    });
    expect(res.ok()).toBeFalsy();
    expect([401, 403]).toContain(res.status());
  });

  test("Anônimo NÃO consegue ler digital_documents (policy retorna false)", async ({
    request,
  }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/digital_documents?select=id&limit=1`,
      { headers },
    );
    // Pode ser 200 com array vazio (RLS filtra) ou 401/403; o crítico é não vazar dados.
    if (res.ok()) {
      const rows = await res.json();
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBe(0);
    } else {
      expect([401, 403]).toContain(res.status());
    }
  });

  test("Anônimo NÃO consegue ler teleconsultations", async ({ request }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/teleconsultations?select=id&limit=1`,
      { headers },
    );
    if (res.ok()) {
      const rows = await res.json();
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBe(0);
    } else {
      expect([401, 403]).toContain(res.status());
    }
  });
});
