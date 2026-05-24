const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "biancadealbuquerquep@gmail.com";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: require an authenticated session and only allow the caller to
    // notify about their OWN signup — this prevents anonymous callers from
    // flooding admin_logs and triggering push spam.
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerEmail = userData.user.email?.toLowerCase() || "";

    const { name, email, professional_type } = await req.json();
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (String(email).toLowerCase() !== callerEmail) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the notification in admin_logs
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", ADMIN_EMAIL)
      .single();

    if (adminProfile) {
      await supabase.from("admin_logs").insert({
        admin_user_id: adminProfile.user_id,
        action: "new_professional_signup",
        target_table: "profiles",
        details: {
          name,
          email,
          professional_type: professional_type || "não informado",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // SECURITY: do NOT include the admin phone or any WhatsApp deep-link in
    // the response. Previously this leaked the admin's number to every caller.
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
