import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, professional_type } = await req.json();

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const adminEmail = "biancadealbuquerquep@gmail.com";

    // Log the notification in admin_logs
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", adminEmail)
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

      // Send push notification to admin if subscribed
      const { data: pushSubs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", adminProfile.user_id);

      if (pushSubs && pushSubs.length > 0) {
        // Use web-push to send notification
        const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
        const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

        if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
          for (const sub of pushSubs) {
            try {
              const payload = JSON.stringify({
                title: "🆕 Novo Cadastro na SALBCARE",
                body: `${name} (${professional_type || "Profissional"}) se cadastrou. Email: ${email}`,
                url: "/admin/users",
              });

              // Simple push notification via fetch to push endpoint
              // The actual push sending would need web-push library
              // For now, we log it for the admin to see in real-time
              console.log("Push notification payload:", payload);
            } catch (pushErr) {
              console.error("Push error:", pushErr);
            }
          }
        }
      }
    }

    // Also send WhatsApp notification link (logged for reference)
    const whatsappMessage = encodeURIComponent(
      `🆕 *Novo cadastro SALBCARE*\n\nNome: ${name}\nEmail: ${email}\nTipo: ${professional_type || "Não informado"}\n\nAcesse: https://salbcare.com.br/admin/users`
    );
    const whatsappLink = `https://wa.me/5588996924700?text=${whatsappMessage}`;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin notified",
        whatsapp_link: whatsappLink,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
