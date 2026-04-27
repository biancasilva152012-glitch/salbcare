import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Componente = { score: number; peso: number; teto: number; detalhe: string; sugestao: string };

const PESOS = {
  tempo_atividade: 15,
  consistencia_atendimentos: 20,
  volume_pacientes: 15,
  recebimentos_comprovados: 20,
  conformidade_regulatoria: 10,
  organizacao_financeira: 10,
  retencao_pacientes: 10,
} as const;

function faixaFromScore(score: number): string {
  if (score >= 850) return "elite";
  if (score >= 700) return "premium";
  if (score >= 500) return "estabelecido";
  if (score >= 300) return "desenvolvimento";
  return "iniciante";
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
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

    const admin = createClient(supabaseUrl, supabaseService);

    // Carrega dados base em paralelo
    const [profileR, apptsR, transR, histR] = await Promise.all([
      admin.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      admin
        .from("appointments")
        .select("id,patient_id,patient_name,date,status,created_at")
        .eq("user_id", user.id),
      admin
        .from("financial_transactions")
        .select("id,amount,type,date,category")
        .eq("user_id", user.id),
      admin
        .from("salbscore_historico")
        .select("score,calculado_em")
        .eq("user_id", user.id)
        .order("calculado_em", { ascending: false })
        .limit(12),
    ]);

    const profile = profileR.data;
    const appts = apptsR.data ?? [];
    const trans = transR.data ?? [];
    const historico = histR.data ?? [];

    if (!profile) {
      // Novo usuário sem perfil ainda — retorna estado vazio em vez de erro
      const emptyComp: Componente = { score: 0, peso: 0, teto: 100, detalhe: "Sem dados ainda", sugestao: "Complete seu cadastro para começar." };
      return new Response(
        JSON.stringify({
          score: 0,
          faixa: "iniciante",
          componentes: {
            tempo_atividade: { ...emptyComp, peso: PESOS.tempo_atividade },
            consistencia_atendimentos: { ...emptyComp, peso: PESOS.consistencia_atendimentos },
            volume_pacientes: { ...emptyComp, peso: PESOS.volume_pacientes },
            recebimentos_comprovados: { ...emptyComp, peso: PESOS.recebimentos_comprovados },
            conformidade_regulatoria: { ...emptyComp, peso: PESOS.conformidade_regulatoria },
            organizacao_financeira: { ...emptyComp, peso: PESOS.organizacao_financeira },
            retencao_pacientes: { ...emptyComp, peso: PESOS.retencao_pacientes },
          },
          evolucao: [],
          media_mensal_6m: 0,
          media_mensal_12m: 0,
          total_atendimentos_12m: 0,
          meses_ativo: 0,
          primeira_vez: true,
          mensagem: "Complete seu cadastro para começar a construir seu SalbScore.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const now = new Date();
    const ms12mAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const ms6mAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const ms90dAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // ───── 1. Tempo de atividade verificada (peso 15)
    const createdAt = profile.created_at ? new Date(profile.created_at) : now;
    const mesesAtivo = Math.max(
      0,
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
    );
    // 100% aos 24 meses
    const tempoNorm = clamp01(mesesAtivo / 24);
    const tempo: Componente = {
      score: Math.round(tempoNorm * 100),
      peso: PESOS.tempo_atividade,
      teto: 100,
      detalhe: `${mesesAtivo.toFixed(1)} meses ativos na SalbCare`,
      sugestao: mesesAtivo < 24
        ? "Continue registrando atendimentos. Seu histórico cresce automaticamente."
        : "Você já construiu o tempo máximo neste componente.",
    };

    // ───── 2. Consistência de atendimentos 12m (peso 20)
    const apptsRealizados12m = appts.filter(
      (a) => a.status !== "cancelled" && new Date(a.date) >= ms12mAgo && new Date(a.date) <= now,
    );
    // distribui por mês
    const mesesAtivos = new Set(
      apptsRealizados12m.map((a) => {
        const d = new Date(a.date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      }),
    );
    // 100% se atende em todos os 12 meses
    const consistNorm = clamp01(mesesAtivos.size / 12);
    const consistencia: Componente = {
      score: Math.round(consistNorm * 100),
      peso: PESOS.consistencia_atendimentos,
      teto: 100,
      detalhe: `Atendimentos em ${mesesAtivos.size} dos últimos 12 meses`,
      sugestao: mesesAtivos.size < 12
        ? "Registre pelo menos 1 atendimento por mês para manter consistência."
        : "Excelente regularidade.",
    };

    // ───── 3. Volume de pacientes únicos (peso 15)
    const pacientesUnicos = new Set(
      appts
        .filter((a) => a.status !== "cancelled")
        .map((a) => a.patient_id || a.patient_name),
    ).size;
    // 100% aos 150 pacientes únicos
    const volNorm = clamp01(pacientesUnicos / 150);
    const volume: Componente = {
      score: Math.round(volNorm * 100),
      peso: PESOS.volume_pacientes,
      teto: 100,
      detalhe: `${pacientesUnicos} pacientes únicos atendidos`,
      sugestao: pacientesUnicos < 150
        ? `Atender ${Math.max(5, Math.ceil((150 - pacientesUnicos) / 12))} pacientes novos por mês leva você ao topo.`
        : "Volume sólido.",
    };

    // ───── 4. Recebimentos comprovados 12m (peso 20)
    const receitas12m = trans
      .filter((t) => t.type === "income" && new Date(t.date) >= ms12mAgo)
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const receitas6m = trans
      .filter((t) => t.type === "income" && new Date(t.date) >= ms6mAgo)
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const mediaMensal12m = receitas12m / 12;
    const mediaMensal6m = receitas6m / 6;
    // 100% aos R$ 15.000/mês de média (12m)
    const recebNorm = clamp01(mediaMensal12m / 15000);
    const recebimentos: Componente = {
      score: Math.round(recebNorm * 100),
      peso: PESOS.recebimentos_comprovados,
      teto: 100,
      detalhe: `Média mensal de R$ ${mediaMensal12m.toFixed(0)} nos últimos 12 meses`,
      sugestao: mediaMensal12m < 15000
        ? "Registre todos os recebimentos no Financeiro. Cada Pix/cartão informado conta para seu score."
        : "Faturamento de alta consistência.",
    };

    // ───── 5. Conformidade regulatória (peso 10)
    const temConselho = !!(profile.council_number && profile.council_state);
    const naoSuspenso =
      !profile.suspended_until || new Date(profile.suspended_until) < now;
    let confScore = 0;
    if (temConselho) confScore += 70;
    if (naoSuspenso) confScore += 30;
    const conformidade: Componente = {
      score: confScore,
      peso: PESOS.conformidade_regulatoria,
      teto: 100,
      detalhe: temConselho
        ? `Registro ativo: ${profile.professional_type} ${profile.council_state} ${profile.council_number}`
        : "Registro do conselho não preenchido",
      sugestao: !temConselho
        ? "Preencha número e UF do conselho no perfil."
        : !naoSuspenso
          ? "Conta suspensa temporariamente. Resolva pendências para liberar."
          : "Tudo em ordem.",
    };

    // ───── 6. Organização financeira (peso 10)
    const temReceitas = trans.some((t) => t.type === "income");
    const temDespesas = trans.some((t) => t.type === "expense");
    const categoriasUsadas = new Set(trans.map((t) => t.category)).size;
    let orgScore = 0;
    if (temReceitas) orgScore += 35;
    if (temDespesas) orgScore += 35;
    if (categoriasUsadas >= 3) orgScore += 30;
    else if (categoriasUsadas >= 1) orgScore += 15;
    const organizacao: Componente = {
      score: orgScore,
      peso: PESOS.organizacao_financeira,
      teto: 100,
      detalhe: `${categoriasUsadas} categorias em uso, receitas: ${temReceitas ? "sim" : "não"}, despesas: ${temDespesas ? "sim" : "não"}`,
      sugestao: orgScore < 100
        ? "Separe receitas e despesas em categorias para maior organização."
        : "Estrutura financeira completa.",
    };

    // ───── 7. Retenção de pacientes 90/180d (peso 10)
    // Pacientes com 2+ atendimentos no histórico
    const contagemPorPaciente = new Map<string, number>();
    appts
      .filter((a) => a.status !== "cancelled")
      .forEach((a) => {
        const key = a.patient_id || a.patient_name || "—";
        contagemPorPaciente.set(key, (contagemPorPaciente.get(key) || 0) + 1);
      });
    const retornantes = Array.from(contagemPorPaciente.values()).filter((c) => c >= 2).length;
    const totalPacientes = contagemPorPaciente.size || 1;
    const taxaRetorno = retornantes / totalPacientes;
    // 100% se 60% dos pacientes retornaram
    const retNorm = clamp01(taxaRetorno / 0.6);
    const retencao: Componente = {
      score: Math.round(retNorm * 100),
      peso: PESOS.retencao_pacientes,
      teto: 100,
      detalhe: `${retornantes} de ${totalPacientes} pacientes retornaram (${(taxaRetorno * 100).toFixed(0)}%)`,
      sugestao: taxaRetorno < 0.6
        ? "Agende retornos no fim de cada consulta. Pacientes recorrentes elevam seu score."
        : "Excelente retenção.",
    };

    const componentes = {
      tempo_atividade: tempo,
      consistencia_atendimentos: consistencia,
      volume_pacientes: volume,
      recebimentos_comprovados: recebimentos,
      conformidade_regulatoria: conformidade,
      organizacao_financeira: organizacao,
      retencao_pacientes: retencao,
    };

    // Score final ponderado, normalizado para 0-1000
    let somaPonderada = 0;
    let somaPesos = 0;
    for (const c of Object.values(componentes)) {
      somaPonderada += (c.score / c.teto) * c.peso;
      somaPesos += c.peso;
    }
    const score = Math.round((somaPonderada / somaPesos) * 1000);
    const faixa = faixaFromScore(score);

    // Salva snapshot (apenas se for primeiro do dia para evitar spam)
    const ultimoSnapshot = historico[0];
    const ultimoCalc = ultimoSnapshot ? new Date(ultimoSnapshot.calculado_em) : null;
    const horasDesdeUltimo = ultimoCalc
      ? (now.getTime() - ultimoCalc.getTime()) / (1000 * 60 * 60)
      : Infinity;
    if (horasDesdeUltimo > 6) {
      await admin.from("salbscore_historico").insert({
        user_id: user.id,
        score,
        faixa,
        componentes,
      });
    }

    return new Response(
      JSON.stringify({
        score,
        faixa,
        componentes,
        evolucao: historico.reverse(),
        media_mensal_6m: mediaMensal6m,
        media_mensal_12m: mediaMensal12m,
        total_atendimentos_12m: apptsRealizados12m.length,
        meses_ativo: mesesAtivo,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
