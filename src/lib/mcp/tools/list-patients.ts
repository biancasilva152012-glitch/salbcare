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
  name: "list_patients",
  title: "List patients",
  description: "List the signed-in professional's patients (name, contact, created_at).",
  inputSchema: {
    limit: z.number().int().min(1).max(200).default(50).describe("Max rows to return"),
    search: z.string().trim().optional().describe("Optional case-insensitive name filter"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, search }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = client(ctx)
      .from("patients")
      .select("id, name, email, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (search) q = q.ilike("name", `%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { patients: data ?? [] },
    };
  },
});
