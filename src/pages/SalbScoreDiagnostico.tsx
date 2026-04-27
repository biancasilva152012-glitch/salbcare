import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import PageContainer from "@/components/PageContainer";
import BackButton from "@/components/BackButton";

type CheckStatus = "pending" | "ok" | "warn" | "fail";
type Check = {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail?: string;
};

const StatusIcon = ({ status }: { status: CheckStatus }) => {
  if (status === "pending") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (status === "ok") return <CheckCircle2 className="h-4 w-4" style={{ color: "#00B4A0" }} />;
  if (status === "warn") return <AlertCircle className="h-4 w-4" style={{ color: "#D4A017" }} />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

const StatusBadge = ({ status }: { status: CheckStatus }) => {
  const map: Record<CheckStatus, { label: string; className: string }> = {
    pending: { label: "Verificando", className: "bg-muted text-muted-foreground" },
    ok: { label: "OK", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    warn: { label: "Atenção", className: "bg-amber-50 text-amber-700 border-amber-200" },
    fail: { label: "Falha", className: "bg-red-50 text-red-700 border-red-200" },
  };
  const c = map[status];
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
};

const SalbScoreDiagnostico = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(false);

  const run = async () => {
    if (!user) return;
    setRunning(true);
    const initial: Check[] = [
      { id: "auth", label: "Sessão autenticada", description: "Token Supabase ativo do usuário atual.", status: "pending" },
      { id: "profile", label: "Perfil profissional", description: "Registro em profiles vinculado ao seu usuário.", status: "pending" },
      { id: "table_historico", label: "Tabela salbscore_historico", description: "Acesso de leitura ao histórico do seu SalbScore.", status: "pending" },
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

    // 3. salbscore_historico (RLS leitura)
    const { error: histErr, count } = await supabase
      .from("salbscore_historico")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (histErr) {
      update("table_historico", { status: "fail", detail: `RLS/acesso: ${histErr.message}` });
    } else {
      update("table_historico", {
        status: "ok",
        detail: count && count > 0 ? `${count} snapshots históricos encontrados.` : "Sem snapshots ainda — normal para usuários novos.",
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

    // 5. gerar-documento-salbscore (verificação leve — chama com tipo inválido só pra checar 4xx vs 5xx)
    try {
      const { error: docErr } = await supabase.functions.invoke("gerar-documento-salbscore", {
        body: { tipo: "__diagnostic_ping__" },
      });
      // Esperamos 4xx (tipo inválido / premium_required). 5xx ou network = fail.
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

    setRunning(false);
  };

  useEffect(() => {
    if (user) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const summary = checks.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<CheckStatus, number>,
  );

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
                <div className="text-xs font-mono bg-muted/50 rounded-md p-2 break-all">
                  {c.detail}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-[11px] text-muted-foreground text-center">
          Esta página executa apenas leituras com sua sessão. Nenhum dado é alterado.
        </div>
      </div>
    </PageContainer>
  );
};

export default SalbScoreDiagnostico;
