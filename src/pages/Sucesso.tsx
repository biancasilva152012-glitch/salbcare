import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Loader2, Clock, Bug, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const MAX_ATTEMPTS = 6; // ~30s polling

/**
 * Single source of truth for what the page renders. Everything (icon, copy,
 * buttons, auto-redirect) is derived from `status` so we never hit the
 * "two booleans disagree" class of bug we had before.
 */
type SucessoStatus = "confirming" | "active" | "pending";

type AttemptLog = {
  at: string;
  attempt: number;
  ok: boolean;
  detail: string;
};

const COPY: Record<
  SucessoStatus,
  {
    title: string;
    description: string;
    icon: typeof CheckCircle2;
    iconClass: string;
  }
> = {
  confirming: {
    title: "Confirmando seu pagamento…",
    description: "Estamos validando seu pagamento com o Stripe. Isso leva alguns segundos.",
    icon: Loader2,
    iconClass: "h-16 w-16 text-primary mx-auto animate-spin",
  },
  active: {
    title: "Pagamento confirmado!",
    description:
      "Sua assinatura foi ativada. Você já pode aproveitar todos os recursos do plano Essencial.",
    icon: CheckCircle2,
    iconClass: "h-16 w-16 text-success mx-auto",
  },
  pending: {
    title: "Pagamento em processamento",
    description:
      "O Stripe ainda está liberando sua assinatura. Pode levar até 1 minuto. Atualize abaixo para verificar.",
    icon: Clock,
    iconClass: "h-16 w-16 text-yellow-500 mx-auto",
  },
};

/**
 * Post-Stripe success page. Stripe webhooks can take a few seconds to flip
 * the subscription on. We poll `refreshSubscription` until `subscribed`
 * flips true (or we hit the max attempts) so the user sees a real status
 * instead of a generic "success" that lies.
 *
 * When the polling exhausts (status="pending"), we expose a diagnostics
 * panel so support can see exactly what was tried and when.
 */
const Sucesso = () => {
  const navigate = useNavigate();
  const { refreshSubscription, subscription, user } = useAuth();
  const [attempts, setAttempts] = useState(0);
  const [logs, setLogs] = useState<AttemptLog[]>([]);
  const [showDiag, setShowDiag] = useState(false);
  const [pageOpenedAt] = useState(() => new Date().toISOString());

  // Kick off an immediate refresh on mount + log it.
  useEffect(() => {
    void (async () => {
      try {
        await refreshSubscription();
        setLogs((l) => [
          ...l,
          { at: new Date().toISOString(), attempt: 0, ok: true, detail: "Refresh inicial enviado ao Stripe" },
        ]);
      } catch (err: any) {
        setLogs((l) => [
          ...l,
          {
            at: new Date().toISOString(),
            attempt: 0,
            ok: false,
            detail: err?.message ?? "Falha desconhecida no refresh inicial",
          },
        ]);
      }
    })();
  }, [refreshSubscription]);

  // Poll until confirmed or we exhaust the budget.
  useEffect(() => {
    if (subscription.subscribed) return;
    if (attempts >= MAX_ATTEMPTS) return;
    const t = setTimeout(async () => {
      const attemptNo = attempts + 1;
      try {
        await refreshSubscription();
        setLogs((l) => [
          ...l,
          {
            at: new Date().toISOString(),
            attempt: attemptNo,
            ok: true,
            detail: `Tentativa ${attemptNo}/${MAX_ATTEMPTS} — Stripe respondeu (subscribed=${subscription.subscribed})`,
          },
        ]);
      } catch (err: any) {
        setLogs((l) => [
          ...l,
          {
            at: new Date().toISOString(),
            attempt: attemptNo,
            ok: false,
            detail: err?.message ?? `Falha na tentativa ${attemptNo}`,
          },
        ]);
      }
      setAttempts(attemptNo);
    }, 5000);
    return () => clearTimeout(t);
  }, [attempts, subscription.subscribed, refreshSubscription]);

  // Single source of truth — everything below derives from this.
  const status: SucessoStatus = useMemo(() => {
    if (subscription.subscribed) return "active";
    if (attempts >= MAX_ATTEMPTS) return "pending";
    return "confirming";
  }, [subscription.subscribed, attempts]);

  // Auto-redirect to dashboard once subscription flips active. Small delay
  // so the user actually sees the green check before being moved.
  useEffect(() => {
    if (status !== "active") return;
    const t = setTimeout(() => navigate("/dashboard", { replace: true }), 2500);
    return () => clearTimeout(t);
  }, [status, navigate]);

  const copy = COPY[status];
  const Icon = copy.icon;

  const handleRetry = () => {
    setAttempts(0);
    setLogs((l) => [
      ...l,
      {
        at: new Date().toISOString(),
        attempt: 0,
        ok: true,
        detail: "Usuário pediu nova verificação manual",
      },
    ]);
    void refreshSubscription();
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("pt-BR", { hour12: false });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 max-w-md w-full text-center space-y-6"
        data-testid="sucesso-card"
        data-status={status}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Icon className={copy.iconClass} aria-hidden />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{copy.title}</h1>
          <p className="text-muted-foreground text-sm">{copy.description}</p>
        </div>

        {status === "confirming" && (
          <p
            className="text-xs text-muted-foreground"
            data-testid="sucesso-attempts"
          >
            Tentativa {attempts + 1}/{MAX_ATTEMPTS}…
          </p>
        )}

        <div className="space-y-2">
          {status === "pending" && (
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full gap-2"
              data-testid="sucesso-retry"
            >
              <Loader2 className="h-4 w-4" />
              Verificar novamente
            </Button>
          )}
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full gradient-primary font-semibold gap-2"
            disabled={status === "confirming"}
            data-testid="sucesso-go-dashboard"
          >
            {status === "confirming" ? "Aguarde…" : "Ir para o Dashboard"}
            {status !== "confirming" && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Diagnostics: visible when we've exhausted polling so the user (and
            support) can see exactly when each attempt happened and why the
            webhook may still be in flight. */}
        {status === "pending" && (
          <div
            className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-left text-[11px]"
            data-testid="sucesso-diagnostics"
          >
            <button
              type="button"
              onClick={() => setShowDiag((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 font-semibold"
              aria-expanded={showDiag}
            >
              <span className="inline-flex items-center gap-1.5">
                <Bug className="h-3.5 w-3.5" />
                Diagnóstico do pagamento
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showDiag ? "rotate-180" : ""}`}
              />
            </button>
            {showDiag && (
              <div className="space-y-2 px-3 pb-3 text-muted-foreground">
                <div className="grid grid-cols-2 gap-1">
                  <span>Página aberta em:</span>
                  <span className="text-foreground">{formatTime(pageOpenedAt)}</span>
                  <span>Tentativas:</span>
                  <span className="text-foreground">{attempts}/{MAX_ATTEMPTS}</span>
                  <span>Conta:</span>
                  <span className="truncate text-foreground" title={user?.email ?? ""}>
                    {user?.email ?? "—"}
                  </span>
                  <span>Status do Stripe:</span>
                  <span className="text-foreground">
                    {subscription.paymentStatus} · subscribed={String(subscription.subscribed)}
                  </span>
                </div>
                {logs.length > 0 && (
                  <div className="rounded-md bg-background/60 p-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide">
                      Histórico de tentativas
                    </p>
                    <ul className="max-h-40 space-y-0.5 overflow-y-auto">
                      {logs.map((log, i) => (
                        <li
                          key={i}
                          className={`flex gap-2 ${log.ok ? "" : "text-destructive"}`}
                          data-testid={`sucesso-diag-log-${i}`}
                        >
                          <span className="font-mono text-[10px]">{formatTime(log.at)}</span>
                          <span className="flex-1">{log.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[10px]">
                  Se o pagamento foi feito mas continua pendente após 1 minuto, o webhook do
                  Stripe pode estar atrasado. Aguarde mais alguns instantes e clique em
                  "Verificar novamente". Em caso de demora persistente, entre em contato com
                  o suporte enviando este horário: <strong>{formatTime(pageOpenedAt)}</strong>.
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Sucesso;
