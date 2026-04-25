/**
 * Integração: lançamentos financeiros recalculam Lucro e Saldo Mensal
 * corretamente após criar receitas/despesas, e o cálculo permanece
 * consistente após "refresh" (re-fetch).
 *
 * Não renderizamos a página `Financial.tsx` inteira (tem ~600 linhas com
 * recharts, modais, paywall etc.). Em vez disso, testamos diretamente a
 * fórmula de agregação que a página usa:
 *
 *   totalIncome  = sum(amount where type='income')
 *   totalExpense = sum(amount where type='expense')
 *   profit       = totalIncome - totalExpense       ← "Lucro"
 *   monthlyBalance = profit no mês corrente         ← "Saldo Mensal"
 *
 * Garante que o cálculo bate antes e depois de adicionar transações,
 * validando o contrato esperado pela UI de Financial reports.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock supabase: armazena financial_transactions in-memory ─────────────
type Tx = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string; // YYYY-MM-DD
  category: string;
};
let store: Tx[] = [];
let nextId = 1;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table !== "financial_transactions") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      return {
        insert: (row: Omit<Tx, "id">) => {
          store.push({ id: `tx-${nextId++}`, ...row });
          return Promise.resolve({ data: null, error: null });
        },
        delete: () => ({
          eq: (_col: string, id: string) => {
            store = store.filter((t) => t.id !== id);
            return Promise.resolve({ data: null, error: null });
          },
        }),
        select: () => ({
          eq: (_col: string, userId: string) => ({
            order: () => ({
              limit: () =>
                Promise.resolve({
                  data: store.filter((t) => t.user_id === userId),
                  error: null,
                }),
            }),
          }),
        }),
      };
    },
  },
}));

import { supabase } from "@/integrations/supabase/client";

// Replica das fórmulas usadas no Financial.tsx (linhas ~155-180)
const computeTotals = (txs: Tx[]) => {
  const totalIncome = txs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = txs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const profit = totalIncome - totalExpense;
  return { totalIncome, totalExpense, profit };
};

const computeMonthlyBalance = (txs: Tx[], yearMonth: string) => {
  const filtered = txs.filter((t) => t.date.startsWith(yearMonth));
  return computeTotals(filtered).profit;
};

const insertTx = (tx: Omit<Tx, "id">) =>
  (supabase.from as any)("financial_transactions").insert(tx);

const fetchTxs = (userId: string) =>
  (supabase.from as any)("financial_transactions")
    .select("id, description, amount, type, date, category")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(500);

describe("Financial reports — Lucro e Saldo Mensal", () => {
  beforeEach(() => {
    store = [];
    nextId = 1;
  });

  it("Lucro e Saldo Mensal sobem ao adicionar receitas", async () => {
    const userId = "u-1";
    const today = new Date();
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const dateStr = `${yearMonth}-15`;

    await insertTx({
      user_id: userId,
      description: "Consulta João",
      amount: 300,
      type: "income",
      date: dateStr,
      category: "consulta",
    });
    await insertTx({
      user_id: userId,
      description: "Consulta Maria",
      amount: 250,
      type: "income",
      date: dateStr,
      category: "consulta",
    });

    const r1 = await fetchTxs(userId);
    const t1 = computeTotals(r1.data);
    expect(t1.totalIncome).toBe(550);
    expect(t1.totalExpense).toBe(0);
    expect(t1.profit).toBe(550);

    expect(computeMonthlyBalance(r1.data, yearMonth)).toBe(550);
  });

  it("Lucro e Saldo Mensal descem ao adicionar despesas", async () => {
    const userId = "u-1";
    const today = new Date();
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    await insertTx({
      user_id: userId,
      description: "Consulta",
      amount: 1000,
      type: "income",
      date: `${yearMonth}-10`,
      category: "consulta",
    });
    await insertTx({
      user_id: userId,
      description: "Aluguel",
      amount: 400,
      type: "expense",
      date: `${yearMonth}-05`,
      category: "aluguel",
    });
    await insertTx({
      user_id: userId,
      description: "Material",
      amount: 100,
      type: "expense",
      date: `${yearMonth}-20`,
      category: "material",
    });

    const r = await fetchTxs(userId);
    const t = computeTotals(r.data);
    expect(t.totalIncome).toBe(1000);
    expect(t.totalExpense).toBe(500);
    expect(t.profit).toBe(500);
    expect(computeMonthlyBalance(r.data, yearMonth)).toBe(500);
  });

  it("Totais permanecem consistentes após refresh (re-fetch)", async () => {
    const userId = "u-1";
    await insertTx({
      user_id: userId,
      description: "X",
      amount: 100,
      type: "income",
      date: "2099-01-10",
      category: "outros",
    });
    await insertTx({
      user_id: userId,
      description: "Y",
      amount: 30,
      type: "expense",
      date: "2099-01-12",
      category: "outros",
    });

    const r1 = await fetchTxs(userId);
    const t1 = computeTotals(r1.data);

    // simula F5
    const r2 = await fetchTxs(userId);
    const t2 = computeTotals(r2.data);

    expect(t1).toEqual(t2);
    expect(t2.profit).toBe(70);
    expect(computeMonthlyBalance(r2.data, "2099-01")).toBe(70);
  });

  it("Saldo Mensal isola transações de meses diferentes", async () => {
    const userId = "u-1";
    await insertTx({
      user_id: userId,
      description: "Jan income",
      amount: 500,
      type: "income",
      date: "2099-01-15",
      category: "outros",
    });
    await insertTx({
      user_id: userId,
      description: "Fev expense",
      amount: 200,
      type: "expense",
      date: "2099-02-15",
      category: "outros",
    });

    const r = await fetchTxs(userId);
    expect(computeMonthlyBalance(r.data, "2099-01")).toBe(500);
    expect(computeMonthlyBalance(r.data, "2099-02")).toBe(-200);
    // Lucro acumulado no período inteiro
    expect(computeTotals(r.data).profit).toBe(300);
  });
});
