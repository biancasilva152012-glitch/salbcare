import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateUserPayload {
  name: string;
  email: string;
  phone: string;
  professional_type: string;
  council_number?: string;
  office_name?: string;
  city?: string;
  state?: string;
  plan: "essencial_mensal" | "essencial_anual";
  notes?: string;
  lead_id?: string;
}

function sanitizeStr(v: unknown, max = 255): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Unauthorized");

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const body = (await req.json()) as CreateUserPayload;

    const name = sanitizeStr(body.name, 100);
    const email = sanitizeStr(body.email, 255).toLowerCase();
    const phone = sanitizeStr(body.phone, 30);
    const professional_type = sanitizeStr(body.professional_type, 50) || "medico";
    const plan = body.plan === "essencial_anual" ? "essencial_anual" : "essencial_mensal";
    const council_number = sanitizeStr(body.council_number, 50);
    const office_name = sanitizeStr(body.office_name, 150);
    const city = sanitizeStr(body.city, 100);
    const state = sanitizeStr(body.state, 50);
    const notes = sanitizeStr(body.notes, 2000);
    const lead_id = sanitizeStr(body.lead_id, 100);

    if (!name || !email || !phone || !professional_type || !plan) {
      throw new Error("Missing required fields");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email");
    }

    const origin = req.headers.get("origin") || "https://salbcare.com";
    const redirectTo = `${origin}/login`;

    // Send invite (user defines own password via magic link)
    const { data: invited, error: inviteErr } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          name,
          phone,
          professional_type,
          council_number,
          user_type: "professional",
        },
      });

    if (inviteErr || !invited.user) {
      // If user already exists, fall back to lookup
      if (inviteErr?.message?.toLowerCase().includes("already")) {
        throw new Error("Esse email já está cadastrado.");
      }
      throw inviteErr || new Error("Falha ao convidar usuário");
    }

    const newUserId = invited.user.id;

    // Build address string
    const officeAddress = [office_name, [city, state].filter(Boolean).join(" - ")]
      .filter(Boolean)
      .join(" — ");

    // Update profile (handle_new_user trigger created the row)
    const profileUpdate: Record<string, unknown> = {
      name,
      email,
      phone,
      professional_type,
      council_number: council_number || null,
      plan,
      payment_status: "active",
      user_type: "professional",
    };
    if (officeAddress) profileUpdate.office_address = officeAddress;
    if (notes) profileUpdate.bio = notes;

    // Wait briefly for trigger then upsert
    await new Promise((r) => setTimeout(r, 400));

    const { error: profileErr } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", newUserId);

    if (profileErr) {
      // Try insert if update missed (trigger may not have run yet)
      await supabase.from("profiles").insert({
        user_id: newUserId,
        ...profileUpdate,
      });
    }

    // Mark lead as converted
    if (lead_id) {
      await supabase
        .from("leads_demo")
        .update({ status: "convertido" })
        .eq("id", lead_id);
    }

    // Log admin action
    await supabase.from("admin_logs").insert({
      admin_user_id: userData.user.id,
      action: "manual_user_create",
      target_table: "profiles",
      target_id: newUserId,
      details: { email, plan, lead_id: lead_id || null },
    });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        email,
        message: "Usuário criado e convite enviado por email.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 400;
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
