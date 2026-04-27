import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import QRCode from "https://esm.sh/qrcode@1.5.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Tipo = "comprovante_renda" | "certidao_atividade" | "selo_publico";

function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return "***.***.***-**";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

function generateHash(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `SALB-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function faixaLabel(faixa: string): string {
  const map: Record<string, string> = {
    iniciante: "Iniciante",
    desenvolvimento: "Em desenvolvimento",
    estabelecido: "Estabelecido",
    premium: "Premium",
    elite: "Elite",
  };
  return map[faixa] ?? faixa;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const tipo: Tipo = body.tipo || "comprovante_renda";
    if (!["comprovante_renda", "certidao_atividade", "selo_publico"].includes(tipo)) {
      return new Response(JSON.stringify({ error: "invalid_tipo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, supabaseService);

    // Verifica plano pago via RPC oficial
    const { data: temPlanoPago } = await admin.rpc("has_active_paid_plan", { _user_id: user.id });
    if (!temPlanoPago) {
      return new Response(JSON.stringify({ error: "premium_required" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Carrega perfil + último snapshot
    const [profileR, scoreR] = await Promise.all([
      admin.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      admin
        .from("salbscore_historico")
        .select("score,faixa,calculado_em")
        .eq("user_id", user.id)
        .order("calculado_em", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const profile = profileR.data;
    const snapshot = scoreR.data;
    if (!profile || !snapshot) {
      return new Response(JSON.stringify({ error: "score_not_calculated" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Para Comprovante de Renda: agrega receitas dos últimos 12m
    const now = new Date();
    const ms12mAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const ms6mAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const { data: trans } = await admin
      .from("financial_transactions")
      .select("amount,type,date")
      .eq("user_id", user.id)
      .gte("date", ms12mAgo.toISOString().slice(0, 10));

    const recs12m = (trans ?? []).filter((t) => t.type === "income");
    const total12m = recs12m.reduce((a, t) => a + Number(t.amount || 0), 0);
    const total6m = recs12m
      .filter((t) => new Date(t.date) >= ms6mAgo)
      .reduce((a, t) => a + Number(t.amount || 0), 0);
    const media12m = total12m / 12;
    const media6m = total6m / 6;

    const { count: totalAtend12m } = await admin
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .gte("date", ms12mAgo.toISOString().slice(0, 10));

    const hash = generateHash();
    const conselho =
      profile.council_number && profile.council_state
        ? `${profile.professional_type?.toUpperCase()} ${profile.council_state} ${profile.council_number}`
        : profile.professional_type?.toUpperCase() || "—";

    const dadosDocumento = {
      nome: profile.name,
      cpf_mascarado: maskCpf((profile as { cpf?: string }).cpf || null),
      conselho,
      media_mensal_6m: media6m,
      media_mensal_12m: media12m,
      total_recebido_12m: total12m,
      total_atendimentos_12m: totalAtend12m ?? 0,
      periodo_inicio: ms12mAgo.toISOString().slice(0, 10),
      periodo_fim: now.toISOString().slice(0, 10),
    };

    // ───── Geração do PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const navy = rgb(0.05, 0.105, 0.165); // #0D1B2A
    const teal = rgb(0, 0.706, 0.627); // #00B4A0
    const muted = rgb(0.45, 0.45, 0.5);
    const ink = rgb(0.1, 0.1, 0.12);

    // Header band
    page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: navy });
    page.drawText("SALBCARE", { x: 40, y: height - 45, size: 22, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Plataforma de Saúde Digital", {
      x: 40, y: height - 65, size: 9, font, color: rgb(0.85, 0.9, 0.95),
    });
    page.drawText("Comprovante de Renda SalbCare", {
      x: width - 250, y: height - 45, size: 13, font: fontBold, color: rgb(1, 1, 1),
    });
    page.drawText(`Hash: ${hash}`, {
      x: width - 250, y: height - 65, size: 8, font, color: rgb(0.85, 0.9, 0.95),
    });

    // Title
    let cursorY = height - 130;
    page.drawText("Comprovante Oficial de Renda", { x: 40, y: cursorY, size: 18, font: fontBold, color: navy });
    cursorY -= 20;
    page.drawText(
      `Emitido em ${now.toLocaleDateString("pt-BR")} • Válido por 90 dias`,
      { x: 40, y: cursorY, size: 10, font, color: muted },
    );

    // Profissional
    cursorY -= 35;
    page.drawText("DADOS DO PROFISSIONAL", { x: 40, y: cursorY, size: 9, font: fontBold, color: teal });
    cursorY -= 18;
    const linhasProf: [string, string][] = [
      ["Nome", profile.name || "—"],
      ["CPF", dadosDocumento.cpf_mascarado],
      ["Registro profissional", conselho],
      ["Tempo de atividade na plataforma", `${Math.max(1, Math.round((now.getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30.44)))} meses`],
    ];
    for (const [k, v] of linhasProf) {
      page.drawText(k, { x: 40, y: cursorY, size: 9, font, color: muted });
      page.drawText(v, { x: 220, y: cursorY, size: 11, font: fontBold, color: ink });
      cursorY -= 18;
    }

    // Comprovação
    cursorY -= 15;
    page.drawText("COMPROVAÇÃO DE RECEBIMENTOS", { x: 40, y: cursorY, size: 9, font: fontBold, color: teal });
    cursorY -= 18;
    const linhasReceita: [string, string][] = [
      ["Período analisado", `${new Date(dadosDocumento.periodo_inicio).toLocaleDateString("pt-BR")} a ${new Date(dadosDocumento.periodo_fim).toLocaleDateString("pt-BR")}`],
      ["Média mensal (últimos 6 meses)", brl(media6m)],
      ["Média mensal (últimos 12 meses)", brl(media12m)],
      ["Total recebido (12 meses)", brl(total12m)],
      ["Atendimentos realizados (12 meses)", String(dadosDocumento.total_atendimentos_12m)],
    ];
    for (const [k, v] of linhasReceita) {
      page.drawText(k, { x: 40, y: cursorY, size: 9, font, color: muted });
      page.drawText(v, { x: 220, y: cursorY, size: 11, font: fontBold, color: ink });
      cursorY -= 18;
    }

    // SalbScore destaque
    cursorY -= 20;
    page.drawRectangle({ x: 40, y: cursorY - 65, width: width - 80, height: 80, color: rgb(0.96, 0.99, 0.98), borderColor: teal, borderWidth: 1 });
    page.drawText("SALBSCORE NA DATA DE EMISSÃO", { x: 55, y: cursorY - 5, size: 9, font: fontBold, color: teal });
    page.drawText(String(snapshot.score), { x: 55, y: cursorY - 45, size: 36, font: fontBold, color: navy });
    page.drawText(`/ 1000`, { x: 145, y: cursorY - 35, size: 12, font, color: muted });
    page.drawText(`Faixa: ${faixaLabel(snapshot.faixa)}`, { x: 55, y: cursorY - 60, size: 10, font, color: ink });

    // Texto legal
    cursorY -= 95;
    page.drawText("DECLARAÇÃO", { x: 40, y: cursorY, size: 9, font: fontBold, color: teal });
    cursorY -= 16;
    const declaracao = `A SalbCare Tecnologia em Saúde Ltda. atesta que o profissional acima identificado mantém atividade verificada na plataforma, com os volumes de recebimentos e atendimentos descritos neste documento, computados a partir das transações registradas pelo próprio titular.`;
    const wrapText = (text: string, maxChars = 95): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        if ((line + " " + w).trim().length > maxChars) {
          lines.push(line.trim());
          line = w;
        } else {
          line = (line + " " + w).trim();
        }
      }
      if (line) lines.push(line);
      return lines;
    };
    for (const line of wrapText(declaracao)) {
      page.drawText(line, { x: 40, y: cursorY, size: 9, font, color: ink });
      cursorY -= 12;
    }

    // QR Code real apontando para /verificar/{hash}
    const verifyUrl = `https://salbcare.com.br/verificar/${hash}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 240,
        color: { dark: "#0D1B2A", light: "#FFFFFF" },
      });
      const qrBytes = Uint8Array.from(
        atob(qrDataUrl.split(",")[1]),
        (c) => c.charCodeAt(0),
      );
      const qrImg = await pdf.embedPng(qrBytes);
      page.drawImage(qrImg, { x: width - 130, y: 90, width: 90, height: 90 });
    } catch (qrErr) {
      console.error("QR generation failed:", qrErr);
      page.drawRectangle({ x: width - 130, y: 90, width: 90, height: 90, borderColor: navy, borderWidth: 1 });
      page.drawText("verificação", { x: width - 120, y: 130, size: 8, font, color: muted });
    }

    // Rodapé legal
    const rodape = `Este documento é emitido pela SalbCare Tecnologia em Saúde Ltda. com base em dados informados e operações registradas pelo titular dentro da plataforma. Não constitui declaração contábil/fiscal nem substitui documentos emitidos por contador (CRC). Para fins legais, deve ser apresentado em conjunto com declaração contábil quando aplicável.`;
    let footY = 70;
    for (const line of wrapText(rodape, 90)) {
      page.drawText(line, { x: 40, y: footY, size: 7, font, color: muted });
      footY -= 9;
    }
    page.drawText(`Verificação de autenticidade: ${verifyUrl}`, {
      x: 40, y: 30, size: 8, font: fontBold, color: navy,
    });

    const pdfBytes = await pdf.save();

    // Salva no Storage (bucket prescriptions já existe e é privado)
    const filePath = `salbscore/${user.id}/${hash}.pdf`;
    const { error: uploadErr } = await admin.storage
      .from("prescriptions")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadErr) {
      console.error("Upload error:", uploadErr);
    }

    // Persiste registro
    const { error: insertErr } = await admin.from("salbscore_documentos").insert({
      user_id: user.id,
      tipo,
      hash_code: hash,
      score_emissao: snapshot.score,
      faixa_emissao: snapshot.faixa,
      dados_documento: dadosDocumento,
      file_path: filePath,
    });
    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Devolve PDF base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
    return new Response(
      JSON.stringify({ hash, file_path: filePath, pdf_base64: base64, verify_url: verifyUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("gerar-documento-salbscore error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
