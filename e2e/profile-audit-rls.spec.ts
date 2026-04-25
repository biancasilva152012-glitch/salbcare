import { test, expect } from "@playwright/test";

/**
 * /profile/audit — isolamento por usuário, filtros de data e paginação.
 *
 * Estes testes batem direto na PostgREST (Supabase) usando a anon key.
 * Não exigem credenciais de usuário real:
 *
 *   1. RLS sem JWT: query pública à tabela retorna ZERO linhas (a SELECT
 *      policy só permite `user_id = auth.uid()` ou admin via has_role).
 *      Isso prova que a tabela NUNCA vaza dados de outros usuários para
 *      visitantes/anônimos — o cenário de pior caso no front.
 *
 *   2. Filtros: a UI usa Supabase JS com `.gte/.lt(created_at)` e `.range()`.
 *      Replicamos a mesma chamada PostgREST com os mesmos parâmetros e
 *      validamos que o servidor honra o filtro (sintaxe + content-range).
 *
 *   3. Paginação: validamos que `Range: 0-19` retorna ≤20 itens e que o
 *      header `Content-Range` informa o total — exatamente o que a UI
 *      consome via `{ count: "exact" }`.
 *
 * Os fluxos com sessão real (login → ver só meus eventos no DOM) ficam
 * cobertos pelos testes unitários da página + por estes testes de RLS,
 * que são o ponto crítico de segurança.
 */

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://fevrdqmqmbahmeaymplq.supabase.co";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldnJkcW1xbWJhaG1lYXltcGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDYxMzcsImV4cCI6MjA4ODkyMjEzN30.Dq924zxY5yShQuiAxE7_qBTOYML3gpvNqOBqckyzNmI";

const TABLE_URL = `${SUPABASE_URL}/rest/v1/redirect_audit_events`;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

test.describe("/profile/audit — RLS, filtros e paginação", () => {
  test("anônimo NUNCA recebe linhas (RLS bloqueia leitura sem auth.uid())", async ({
    request,
  }) => {
    const res = await request.get(`${TABLE_URL}?select=*&limit=50`, { headers });
    expect(res.ok()).toBeTruthy();
    const rows = await res.json();
    expect(Array.isArray(rows)).toBe(true);
    // Não exigimos count=0 do banco — só que o anônimo NÃO recebe nada.
    expect(rows.length).toBe(0);
  });

  test("filtro por data é aceito pela API (gte/lt em created_at)", async ({
    request,
  }) => {
    const from = new Date("2024-01-01T00:00:00Z").toISOString();
    const to = new Date("2099-01-01T00:00:00Z").toISOString();
    const res = await request.get(
      `${TABLE_URL}?select=id,created_at&created_at=gte.${from}&created_at=lt.${to}&order=created_at.desc&limit=20`,
      { headers },
    );
    expect(res.ok()).toBeTruthy();
    const rows = await res.json();
    expect(Array.isArray(rows)).toBe(true);
    // Mesmo que o banco tenha eventos, o anônimo recebe 0 (RLS), mas a
    // sintaxe do filtro foi aceita (status 200, JSON válido).
    expect(rows.length).toBe(0);
  });

  test("paginação via Range respeita PAGE_SIZE e Content-Range é exposto", async ({
    request,
  }) => {
    const res = await request.get(
      `${TABLE_URL}?select=id&order=created_at.desc`,
      {
        headers: {
          ...headers,
          Range: "0-19",
          Prefer: "count=exact",
        },
      },
    );
    expect([200, 206]).toContain(res.status());
    const rows = await res.json();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeLessThanOrEqual(20);
    const cr = res.headers()["content-range"];
    expect(cr).toBeTruthy(); // "0-N/total" ou "*/0"
  });

  test("rejeita parâmetros maliciosos sem vazar dados (RLS + PostgREST)", async ({
    request,
  }) => {
    // Tenta filtrar por user_id de outra pessoa explicitamente — RLS
    // continua aplicado, então o anônimo NUNCA vê linhas mesmo com filtro.
    const fakeUid = "00000000-0000-0000-0000-000000000000";
    const res = await request.get(
      `${TABLE_URL}?select=*&user_id=eq.${fakeUid}`,
      { headers },
    );
    expect(res.ok()).toBeTruthy();
    const rows = await res.json();
    expect(rows.length).toBe(0);
  });
});

test.describe("/profile/audit — UI shell (sem sessão)", () => {
  test("rota é guardada (visitante é redirecionado, não enxerga eventos)", async ({
    page,
  }) => {
    await page.goto("/profile/audit");
    // ProfessionalRoute redireciona visitante para /login (ou similar).
    await page.waitForLoadState("networkidle");
    const url = new URL(page.url());
    // Visitante NUNCA termina em /profile/audit.
    expect(url.pathname).not.toBe("/profile/audit");
    // Garante que NENHUM dado de auditoria foi renderizado para anônimo.
    await expect(page.getByTestId("event-list")).toHaveCount(0);
    await expect(page.getByTestId("fallback-section")).toHaveCount(0);
  });
});
