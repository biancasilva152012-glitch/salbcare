import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const headers = Object.fromEntries(req.headers.entries());
  let body = "";
  try { body = await req.text(); } catch {}

  console.log(`[WEBHOOK-TEST] ${timestamp} | Method: ${method}`);
  console.log(`[WEBHOOK-TEST] Headers:`, JSON.stringify(headers));
  console.log(`[WEBHOOK-TEST] Body (first 500 chars):`, body.substring(0, 500));

  return new Response(JSON.stringify({ 
    ok: true, 
    timestamp,
    method,
    bodyLength: body.length 
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
