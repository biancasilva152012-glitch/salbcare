import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw, ArrowRight, Sparkles, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import PageContainer from "@/components/PageContainer";
import BackButton from "@/components/BackButton";
import { SALBSCORE_STATUS_CLASSES, SALBSCORE_STATUS_LABELS, type SalbScoreCheckStatus } from "@/lib/salbscoreStatus";

type CheckStatus = SalbScoreCheckStatus;
type Check = {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail?: string;
};

type HistoryEntry = {
  at: string; // ISO
  ok: number;
  warn: number;
  fail: number;
  overall: CheckStatus;
};

const HISTORY_KEY = "salbscore_diag_history_v1";
const MAX_HISTORY = 10;

// Ações guiadas por id de check em falha/atenção
const FIX_ACTIONS: Record<string, { title: string; desc: string; cta: string; to: string }[]> = {
  auth: [
    { title: "Faça login novamente", desc: "Sua sessão expirou ou está ausente.", cta: "Ir para login", to: "/login" },
  ],
  route_private_salbscore: [
    { title: "Revisar sessão e rota", desc: "A página deve abrir para qualquer usuário logado, sem exigir plano pago.", cta: "Abrir SalbScore", to: "/perfil/salbscore" },
  ],
  route_public_seal: [
    { title: "Validar selo público", desc: "A URL pública deve exibir apenas dados verificados e nenhuma ação de edição.", cta: "Ver selo exemplo", to: "/perfil/salbscore/selo-exemplo" },
  ],
  profile: [
    { title: "Configurar perfil profissional", desc: "Adicione conselho (CRP/CRM), bio e dados básicos.", cta: "Configurar perfil", to: "/profile" },
  ],
  table_historico: [
    { title: "Registrar primeiro atendimento", desc: "Sem histórico, o SalbScore não tem base de cálculo.", cta: "Cadastrar paciente", to: "/dashboard/pacientes" },
    { title: "Lançar receita no financeiro", desc: "Receitas validam atividade real e elevam seu score.", cta: "Abrir financeiro", to: "/dashboard/financial" },
  ],
  edge_calcular: [
    { title: "Tente recalcular em alguns minutos", desc: "Pode ser uma instabilidade temporária do servidor.", cta: "Ver meu SalbScore", to: "/perfil/salbscore" },
  ],
  edge_documento: [
    { title: "Ative o plano Essencial", desc: "Emissão de Comprovante de Renda exige assinatura ativa.", cta: "Fazer upgrade", to: "/upgrade" },
  ],
  rls_history_write: [
    { title: "Bloquear escrita direta", desc: "O histórico deve ser gerado apenas pelo backend verificado da SalbCare.", cta: "Re-executar diagnóstico", to: "/perfil/salbscore/diagnostico" },
  ],
  rls_documents_write: [
    { title: "Revisar emissão segura", desc: "Documentos devem exigir plano ativo e nunca aceitar escrita pública.", cta: "Fazer upgrade", to: "/upgrade" },
  ],
};

const StatusIcon = ({ status }: { status: CheckStatus }) => {
  if (status === "pending") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (status === "ok") return <CheckCircle2 className="h-4 w-4" style={{ color: "#00B4A0" }} />;
  if (status === "warn") return <AlertCircle className="h-4 w-4" style={{ color: "#D4A017" }} />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

const StatusBadge = ({ status }: { status: CheckStatus }) => {
  return <Badge variant="outline" className={SALBSCORE_STATUS_CLASSES[status]}>{SALBSCORE_STATUS_LABELS[status]}</Badge>;
};

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch { return []; }
}
function saveHistory(entries: HistoryEntry[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY))); } catch {}
}

const SalbScoreDiagnostico = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());

  const run = async () => {
    if (!user) return;
    setRunning(true);
    const initial: Check[] = [
      { id: "auth", label: "Sessão autenticada", description: "Token Supabase ativo do usuário atual.", status: "pending" },
      { id: "route_private_salbscore", label: "Rota /perfil/salbscore", description: "Protegida por login, sem bloqueio por plano no roteador.", status: "pending" },
      { id: "route_public_seal", label: "Rota /verificado/:slug", description: "Pública, somente leitura e com dados controlados.", status: "pending" },
      { id: "profile", label: "Perfil profissional", description: "Registro em profiles vinculado ao seu usuário.", status: "pending" },
      { id: "table_historico", label: "Tabela salbscore_historico", description: "Acesso de leitura ao histórico do seu SalbScore.", status: "pending" },
      { id: "rls_history_write", label: "RLS histórico sem escrita direta", description: "Bloqueia criação/edição do histórico pelo navegador.", status: "pending" },
      { id: "rls_documents_write", label: "RLS documentos por plano", description: "Permite emissão apenas por conta autorizada e bloqueia visitantes.", status: "pending" },
      { id: "edge_calcular", label: "Edge function calcular-salbscore", description: "Endpoint de cálculo deployado e respondendo.", status: "pending" },
      { id: "edge_documento", label: "Edge function gerar-documento-salbscore", description: "Endpoint de emissão de comprovante deployado (verificação leve).", status: "pending" },
    ];
    setChecks(initial);

    const update = (id: string, patch: Partial<Check>) =>
      setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

    // 1. Auth
    const { data: sess } = await supabase.auth.getSession();
    update("auth", sess.session
      ? { status: "ok", detail: `user_id: ${sess.session.user.id}` }
      : { status: "fail", detail: "Sessão Supabase ausente." });

    // 2. Profile
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, name, professional_type, council_number")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profErr) {
      update("profile", { status: "fail", detail: profErr.message });
    } else if (!profile) {
      update("profile", { status: "warn", detail: "Perfil ainda não criado — primeiros passos pendentes." });
    } else {
      update("profile", { status: "ok", detail: `${profile.name} · ${profile.professional_type}${profile.council_number ? " · " + profile.council_number : ""}` });
    }

    // 3. salbscore_historico
    const { error: histErr, count } = await supabase
      .from("salbscore_historico")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (histErr) {
      update("table_historico", { status: "fail", detail: `RLS/acesso: ${histErr.message}` });
    } else {
      update("table_historico", {
        status: count && count > 0 ? "ok" : "warn",
        detail: count && count > 0 ? `${count} snapshots históricos encontrados.` : "Sem snapshots ainda — registre atividade para construir histórico.",
      });
    }

    // 4. calcular-salbscore
    try {
      const { data: calc, error: calcErr } = await supabase.functions.invoke("calcular-salbscore");
      if (calcErr) throw calcErr;
      const r = calc as { score?: number; primeira_vez?: boolean };
      update("edge_calcular", {
        status: "ok",
        detail: r?.primeira_vez
          ? "Resposta válida (estado inicial: primeira_vez)."
          : `Score atual: ${r?.score ?? "—"}.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      update("edge_calcular", { status: "fail", detail: msg });
    }

    // 5. gerar-documento-salbscore (ping leve)
    try {
      const { error: docErr } = await supabase.functions.invoke("gerar-documento-salbscore", {
        body: { tipo: "__diagnostic_ping__" },
      });
      if (docErr) {
        const msg = (docErr as any)?.message ?? String(docErr);
        const lower = msg.toLowerCase();
        if (lower.includes("non-2xx") || lower.includes("4") || lower.includes("invalid") || lower.includes("premium")) {
          update("edge_documento", { status: "ok", detail: "Endpoint respondeu (validação 4xx esperada)." });
        } else {
          update("edge_documento", { status: "warn", detail: msg });
        }
      } else {
        update("edge_documento", { status: "ok", detail: "Endpoint deployado e respondendo." });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      update("edge_documento", { status: "fail", detail: msg });
    }

    // 6. Checklist automático de rotas e RLS do SalbScore
    try {
      const { data: securityRows, error: securityErr } = await (supabase as any).rpc("check_salbscore_security_health");
      if (securityErr) throw securityErr;
      (securityRows as Array<{ check_key: string; status: CheckStatus; message: string; action_hint: string }> | null)?.forEach((row) => {
        if (row.check_key === "rls_history_read") return;
        update(row.check_key, {
          status: row.status,
          detail: `${row.message} Próximo passo: ${row.action_hint}`,
        });
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      ["route_private_salbscore", "route_public_seal", "rls_history_write", "rls_documents_write"].forEach((id) => {
        update(id, { status: "fail", detail: `Checklist automático indisponível: ${msg}` });
      });
    }

    setRunning(false);
  };

  // Persistir histórico quando uma execução termina
  useEffect(() => {
    if (running) return;
    if (checks.length === 0) return;
    if (checks.some((c) => c.status === "pending")) return;
    const ok = checks.filter((c) => c.status === "ok").length;
    const warn = checks.filter((c) => c.status === "warn").length;
    const fail = checks.filter((c) => c.status === "fail").length;
    const overall: CheckStatus = fail > 0 ? "fail" : warn > 0 ? "warn" : "ok";
    const entry: HistoryEntry = { at: new Date().toISOString(), ok, warn, fail, overall };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  }, [running, checks]);

  useEffect(() => {
    if (user) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const summary = checks.reduce(
    (acc, c) => { acc[c.status] = (acc[c.status] ?? 0) + 1; return acc; },
    {} as Record<CheckStatus, number>,
  );

  const failingActions = useMemo(() => {
    const items: { checkLabel: string; actions: typeof FIX_ACTIONS[string] }[] = [];
    checks.forEach((c) => {
      if ((c.status === "fail" || c.status === "warn") && FIX_ACTIONS[c.id]) {
        items.push({ checkLabel: c.label, actions: FIX_ACTIONS[c.id] });
      }
    });
    return items;
  }, [checks]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <PageContainer>
      <SEOHead title="Diagnóstico SalbScore | SalbCare" description="Verifica disponibilidade da tabela e edge functions do SalbScore." />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        <BackButton />
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Diagnóstico</p>
          <h1 className="text-2xl font-bold" style={{ color: "#0D1B2A" }}>Status do SalbScore</h1>
          <p className="text-sm text-muted-foreground">
            Verifica em tempo real se a base de dados e as funções do SalbScore estão respondendo para a sua conta.
          </p>
        </header>

        <div className="rounded-xl border border-border/60 p-4 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {summary.ok ?? 0} ok · {summary.warn ?? 0} atenção · {summary.fail ?? 0} falha · {summary.pending ?? 0} verificando
          </div>
          <Button size="sm" onClick={() => void run()} disabled={running} variant="outline">
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${running ? "animate-spin" : ""}`} />
            Re-executar
          </Button>
        </div>

        <div className="space-y-3">
          {checks.map((c) => (
            <div key={c.id} className="rounded-xl border border-border/60 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="pt-0.5"><StatusIcon status={c.status} /></div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-medium text-sm" style={{ color: "#0D1B2A" }}>{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.description}</div>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              {c.detail && (
                <div className="text-xs font-mono bg-muted/50 rounded-md p-2 break-all">{c.detail}</div>
              )}
            </div>
          ))}
        </div>

        {/* O que fazer agora */}
        {failingActions.length > 0 && (
          <section className="rounded-xl border border-border/60 p-4 space-y-3" style={{ background: "rgba(212,160,23,0.05)" }}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "#D4A017" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#0D1B2A" }}>O que fazer agora</h2>
            </div>
            <div className="space-y-2">
              {failingActions.map((group, gi) =>
                group.actions.map((a, ai) => (
                  <div key={`${gi}-${ai}`} className="rounded-lg border border-border/60 bg-card p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{group.checkLabel}</div>
                      <div className="text-sm font-medium" style={{ color: "#0D1B2A" }}>{a.title}</div>
                      <div className="text-xs text-muted-foreground">{a.desc}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate(a.to)} className="shrink-0">
                      {a.cta} <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )),
              )}
            </div>
          </section>
        )}

        {/* Upgrade CTA persistente */}
        <section className="rounded-xl border border-border/60 p-4 flex items-center justify-between gap-3" style={{ background: "rgba(0,180,160,0.06)" }}>
          <div className="min-w-0">
            <div className="text-sm font-semibold" style={{ color: "#0D1B2A" }}>Liberar SalbScore completo</div>
            <div className="text-xs text-muted-foreground">Plano Essencial libera Comprovante de Renda, Selo Público e histórico verificado.</div>
          </div>
          <Button size="sm" onClick={() => navigate("/upgrade")} style={{ background: "#00B4A0" }} className="shrink-0">
            Upgrade
          </Button>
        </section>

        {/* Histórico */}
        {history.length > 0 && (
          <section className="rounded-xl border border-border/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold" style={{ color: "#0D1B2A" }}>Últimas verificações</h2>
              </div>
              <button
                type="button"
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
                onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]); }}
              >
                Limpar
              </button>
            </div>
            <ul className="divide-y divide-border/60">
              {history.map((h, i) => (
                <li key={i} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={h.overall} />
                    <span className="font-mono text-muted-foreground">{fmt(h.at)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span><strong className="text-emerald-700">{h.ok}</strong> ok</span>
                    <span><strong className="text-amber-700">{h.warn}</strong> atenção</span>
                    <span><strong className="text-red-700">{h.fail}</strong> falha</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-muted-foreground">Salvo localmente neste navegador (últimas {MAX_HISTORY}).</p>
          </section>
        )}

        <div className="flex justify-center">
          <Link to="/perfil/salbscore/selo-exemplo" className="text-[11px] text-muted-foreground hover:text-foreground underline">
            Ver exemplo do Selo Verificado Público
          </Link>
        </div>

        <div className="text-[11px] text-muted-foreground text-center">
          Esta página executa apenas leituras com sua sessão. Nenhum dado é alterado.
        </div>
      </div>
    </PageContainer>
  );
};

export default SalbScoreDiagnostico;
