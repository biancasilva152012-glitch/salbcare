import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function client(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "financial_summary",
  title: "Financial summary",
  description:
    "Aggregate the signed-in professional's income, expenses, and balance from their financial transactions.",
  inputSchema: {
    from: z.string().optional().describe("ISO date (YYYY-MM-DD) — lower bound, inclusive"),
    to: z.string().optional().describe("ISO date (YYYY-MM-DD) — upper bound, inclusive"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = client(ctx).from("financial_transactions").select("type, amount, transaction_date");
    if (from) q = q.gte("transaction_date", from);
    if (to) q = q.lte("transaction_date", to);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    let income = 0;
    let expenses = 0;
    for (const row of data ?? []) {
      const amt = Number((row as any).amount) || 0;
      if ((row as any).type === "income") income += amt;
      else if ((row as any).type === "expense") expenses += amt;
    }
    const summary = { income, expenses, balance: income - expenses, count: data?.length ?? 0 };
    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});
