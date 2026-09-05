import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { enforceLimits, getClientIp, originAllowed, originForbidden } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLANS = ["monthly", "annual"] as const;
const STATUSES = ["trialing", "active", "past_due", "canceled"] as const;

type Plan = (typeof PLANS)[number];
type Status = (typeof STATUSES)[number];

function str(v: unknown, max = 255): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function periodEnd(plan: Plan, status: Status): string | null {
  if (status === "canceled") return new Date().toISOString();
  const d = new Date();
  if (status === "trialing") d.setDate(d.getDate() + 14);
  else if (plan === "annual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!originAllowed(req)) return originForbidden(corsHeaders);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const { data: caller, error: callerErr } = await admin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (callerErr || !caller.user) throw new Error("Unauthorized");

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: caller.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const blocked = await enforceLimits({
      ip: getClientIp(req),
      identifier: caller.user.id,
      action: "sensitive",
      corsHeaders,
    });
    if (blocked) return blocked;

    const body = await req.json().catch(() => ({}));
    const action = str(body.action, 40);

    // ---------- LIST ----------
    if (action === "list") {
      const { data: subs, error } = await admin
        .from("pro_subscriptions")
        .select("user_id, plan, status, current_period_end, stripe_subscription_id, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error("Falha ao listar assinaturas");

      const ids = (subs ?? []).map((s) => s.user_id);
      const { data: partners } = ids.length
        ? await admin
            .from("local_partners")
            .select("owner_user_id, name, profession, city, is_published")
            .in("owner_user_id", ids)
        : { data: [] as Array<Record<string, unknown>> };

      const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const emailById = new Map(
        (authList?.users ?? []).map((u) => [u.id, u.email ?? ""] as const)
      );

      const rows = (subs ?? []).map((s) => {
        const p = (partners ?? []).find(
          (x) => (x as { owner_user_id: string }).owner_user_id === s.user_id
        ) as { name?: string; profession?: string; city?: string; is_published?: boolean } | undefined;
        return {
          user_id: s.user_id,
          email: emailById.get(s.user_id) ?? "",
          name: p?.name ?? "",
          profession: p?.profession ?? "",
          city: p?.city ?? "",
          is_published: p?.is_published ?? false,
          plan: s.plan,
          status: s.status,
          current_period_end: s.current_period_end,
          manual: !s.stripe_subscription_id,
          created_at: s.created_at,
        };
      });
      return json({ professionals: rows });
    }

    // ---------- CREATE PROFESSIONAL ----------
    if (action === "create_professional") {
      const name = str(body.name, 120);
      const email = str(body.email, 255).toLowerCase();
      const password = str(body.password, 72);
      const profession = str(body.profession, 60) || "dentista";
      const city = str(body.city, 120);
      const whatsapp = str(body.whatsapp, 30);
      const plan: Plan = body.plan === "annual" ? "annual" : "monthly";
      const status: Status = STATUSES.includes(body.status) ? body.status : "active";

      if (!name || !email) throw new Error("Nome e e-mail são obrigatórios");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido");
      if (password && password.length < 8) throw new Error("A senha precisa de 8 caracteres ou mais");

      const created = await admin.auth.admin.createUser({
        email,
        password: password || crypto.randomUUID() + "aA1!",
        email_confirm: true,
        user_metadata: { name, professional_type: profession, user_type: "professional" },
      });

      let userId = created.data.user?.id ?? "";
      if (created.error) {
        if (!created.error.message?.toLowerCase().includes("already")) {
          throw new Error("Não foi possível criar a conta");
        }
        const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        userId = existing?.users.find((u) => u.email?.toLowerCase() === email)?.id ?? "";
        if (!userId) throw new Error("Esse e-mail já existe e não foi possível localizá-lo");
      }

      const { data: partnerRow } = await admin
        .from("local_partners")
        .select("id")
        .eq("owner_user_id", userId)
        .maybeSingle();

      const partnerData = {
        owner_user_id: userId,
        name,
        category: "health",
        profession,
        city: city || null,
        whatsapp: whatsapp || null,
        is_published: false,
        active: true,
      };
      if (partnerRow?.id) {
        await admin.from("local_partners").update(partnerData).eq("id", partnerRow.id);
      } else {
        await admin.from("local_partners").insert(partnerData);
      }

      await admin.from("pro_subscriptions").upsert(
        {
          user_id: userId,
          plan,
          status,
          current_period_end: periodEnd(plan, status),
        },
        { onConflict: "user_id" }
      );

      await admin.from("admin_logs").insert({
        admin_user_id: caller.user.id,
        action: "pro_provision_create",
        target_table: "pro_subscriptions",
        target_id: userId,
        details: { email, plan, status },
      });

      return json({ success: true, user_id: userId, temporary_password: !password });
    }

    // ---------- SET SUBSCRIPTION ----------
    if (action === "set_subscription") {
      const userId = str(body.user_id, 60);
      const plan: Plan = body.plan === "annual" ? "annual" : "monthly";
      const status: Status = STATUSES.includes(body.status) ? body.status : "active";
      if (!userId) throw new Error("Profissional inválido");

      const { error } = await admin.from("pro_subscriptions").upsert(
        { user_id: userId, plan, status, current_period_end: periodEnd(plan, status) },
        { onConflict: "user_id" }
      );
      if (error) throw new Error("Falha ao atualizar a assinatura");

      await admin.from("admin_logs").insert({
        admin_user_id: caller.user.id,
        action: "pro_provision_update",
        target_table: "pro_subscriptions",
        target_id: userId,
        details: { plan, status },
      });

      return json({ success: true });
    }

    // ---------- RESET PASSWORD ----------
    if (action === "set_password") {
      const userId = str(body.user_id, 60);
      const password = str(body.password, 72);
      if (!userId || password.length < 8) throw new Error("Informe uma senha com 8 caracteres ou mais");
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) throw new Error("Falha ao definir a senha");
      await admin.from("admin_logs").insert({
        admin_user_id: caller.user.id,
        action: "pro_provision_password",
        target_table: "auth.users",
        target_id: userId,
        details: {},
      });
      return json({ success: true });
    }

    throw new Error("Ação inválida");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 400;
    return json({ error: msg }, status);
  }
});
