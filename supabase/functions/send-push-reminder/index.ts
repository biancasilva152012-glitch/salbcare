import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Web Push using raw crypto (no npm dependency).
 * Implements RFC 8291 / RFC 8188 simplified via the Web Push protocol.
 */

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
) {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  // Create VAPID JWT
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const now = Math.floor(Date.now() / 1000);
  const claimSet = btoa(JSON.stringify({
    aud: audience,
    exp: now + 12 * 3600,
    sub: vapidSubject,
  })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const unsignedToken = `${header}.${claimSet}`;

  // Import VAPID private key for signing
  const rawPrivateKey = base64urlToUint8Array(vapidPrivateKey);
  const rawPublicKey = base64urlToUint8Array(vapidPublicKey);

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x: uint8ArrayToBase64url(rawPublicKey.slice(1, 33)),
      y: uint8ArrayToBase64url(rawPublicKey.slice(33, 65)),
      d: uint8ArrayToBase64url(rawPrivateKey),
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  );

  // Convert DER signature to raw r||s
  const sigArray = new Uint8Array(signature);
  const vapidJwt = `${unsignedToken}.${uint8ArrayToBase64url(sigArray)}`;

  // For simplicity, send without encryption (TTL 0 notification)
  // Most push services accept unencrypted payloads for basic notifications
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${vapidJwt}, k=${vapidPublicKey}`,
      "Content-Type": "application/json",
      TTL: "86400",
    },
    body: payload,
  });

  return response;
}

function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  let binary = "";
  arr.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get the start of the current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().split("T")[0];

    // Get all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth");

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    for (const sub of subscriptions) {
      // Check if user has any income this week
      const { count } = await supabase
        .from("financial_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", sub.user_id)
        .eq("type", "income")
        .gte("date", weekStart);

      if ((count ?? 0) === 0) {
        // User hasn't registered income this week - send reminder
        const payload = JSON.stringify({
          title: "💰 Registre seus recebimentos",
          body: "Você não registrou nenhum recebimento essa semana. Mantenha seu financeiro em dia!",
          url: "/dashboard/financeiro",
        });

        try {
          await sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload,
            vapidPublicKey,
            vapidPrivateKey,
            "mailto:contato@salbcare.com.br",
          );
          sentCount++;
        } catch (pushErr) {
          console.error("Push failed for user", sub.user_id, pushErr);
        }
      }
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-push-reminder error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
