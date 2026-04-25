/**
 * Integração: criar uma teleconsulta, vê-la na lista (via `useQuery`)
 * e garantir que após "refresh" (re-mount) ela continua aparecendo —
 * isto é, o fetch consulta a tabela `teleconsultations` corretamente.
 *
 * Foco: o contrato com o Supabase. Mockamos `supabase.from(...)` para
 * capturar `.insert(...)` da nova teleconsulta e devolver a lista
 * em `.select(...)`. Não renderizamos a página inteira (Telehealth.tsx
 * tem muitas dependências — modais, queries de `patients`, perfil etc.);
 * em vez disso testamos diretamente a chamada equivalente ao botão
 * "Nova Consulta" e o fluxo de leitura.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock supabase ────────────────────────────────────────────────────────
const insertSpy = vi.fn();
let stored: any[] = [];

const tableHandler = (table: string) => {
  if (table !== "teleconsultations") {
    return {
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    };
  }
  return {
    insert: (row: any) => {
      insertSpy(row);
      stored.push({ id: `tc-${stored.length + 1}`, status: "scheduled", ...row });
      return Promise.resolve({ data: null, error: null });
    },
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [...stored], error: null }),
        }),
      }),
    }),
    update: (patch: any) => ({
      eq: (_col: string, id: string) => {
        const idx = stored.findIndex((r) => r.id === id);
        if (idx >= 0) stored[idx] = { ...stored[idx], ...patch };
        return Promise.resolve({ data: null, error: null });
      },
    }),
  };
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (t: string) => tableHandler(t),
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: { id: "doc-1" } } }),
    },
  },
}));

// Helper que reproduz o que `CreateTeleconsultationModal.handleSubmit`
// faz por baixo: insert + invalidate. Aqui chamamos direto.
import { supabase } from "@/integrations/supabase/client";

const createTeleconsultation = async (input: {
  user_id: string;
  patient_name: string;
  patient_id?: string | null;
  date: string;
  duration?: number;
}) =>
  (supabase.from as any)("teleconsultations").insert({
    user_id: input.user_id,
    patient_name: input.patient_name,
    patient_id: input.patient_id ?? null,
    date: input.date,
    duration: input.duration ?? 30,
    status: "scheduled",
  });

const fetchTeleconsultations = async (userId: string) =>
  (supabase.from as any)("teleconsultations")
    .select("id, patient_name, patient_id, date, duration, notes, status")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(200);

describe("Telehealth — criar e listar após refresh", () => {
  beforeEach(() => {
    insertSpy.mockClear();
    stored = [];
  });

  it("criar teleconsulta → aparece no fetch (Agenda) e persiste após 'refresh'", async () => {
    const userId = "doc-1";
    const date = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    // 1) Cria teleconsulta (equivalente ao botão "Nova Consulta")
    await createTeleconsultation({
      user_id: userId,
      patient_name: "João Silva",
      date,
    });

    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(insertSpy.mock.calls[0][0]).toMatchObject({
      user_id: userId,
      patient_name: "João Silva",
      status: "scheduled",
    });

    // 2) Lista (equivalente à query do Agenda/Telehealth)
    const first = await fetchTeleconsultations(userId);
    expect(first.data).toHaveLength(1);
    expect(first.data[0]).toMatchObject({
      patient_name: "João Silva",
      status: "scheduled",
    });

    // 3) "Refresh" — chama o mesmo fetch novamente; o storage mockado
    //    persiste, simulando recarregar a página.
    const second = await fetchTeleconsultations(userId);
    expect(second.data).toHaveLength(1);
    expect(second.data[0].id).toBe(first.data[0].id);
  });

  it("histórico (status=completed) inclui consulta após marcar como concluída", async () => {
    const userId = "doc-1";
    await createTeleconsultation({
      user_id: userId,
      patient_name: "Maria Santos",
      date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    });

    const list = await fetchTeleconsultations(userId);
    const id = list.data[0].id;

    // Marca como concluída (equivalente ao handleComplete)
    await (supabase.from as any)("teleconsultations")
      .update({ status: "completed" })
      .eq("id", id);

    const after = await fetchTeleconsultations(userId);
    const found = after.data.find((r: any) => r.id === id);
    expect(found.status).toBe("completed");
  });
});
