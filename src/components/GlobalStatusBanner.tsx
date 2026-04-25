import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, Sparkles, Users, Crown, X, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import { getGuestUsage, hasGuestData } from "@/lib/guestStorage";

/**
 * Global status banner shown at the top of every protected screen.
 *
 * Surfaces three states (single source of truth, in priority order):
 *   1. Guest visitor close to / at quota → contador X/Y + "Crie sua conta grátis"
 *   2. Authenticated user on free plan close to / at quota → contador + "Upgrade Essencial"
 *   3. Trial countdown (≤3 days left) → "Trial acaba em N dias"
 *
 * Quando o limite é atingido, o título passa para "Você está bloqueado…" e
 * o CTA muda para "Desbloquear agora" (cor destrutiva).
 *
 * Hidden on:
 *   - Public marketing pages, blog, login/register, checkout flow, sucesso/cancelado
 *   - When the user has the active subscription and no trial countdown
 *   - When the user dismissed it for the current threshold (resets when state worsens)
 */
const DISMISS_KEY = "salbcare_status_banner_dismissed";

const HIDDEN_PREFIXES = [
  "/login",
  "/register",
  "/cadastro",
  "/forgot-password",
  "/reset-password",
  "/checkout",
  "/sucesso",
  "/cancelado",
  "/payment-success",
  "/sync-guest-data",
  "/upgrade",
  "/planos",
  "/precos",
  "/terms",
  "/privacy",
  "/blog",
  "/diagnostico",
  "/p/",
  "/profissionais",
  "/consulta-online",
  "/pronto-atendimento",
  "/patient-dashboard",
  "/admin",
  "/guest",
  "/experimente",
  "/index",
  "/para-profissionais",
];

const isHiddenRoute = (pathname: string) => {
  if (pathname === "/") return true;
  return HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
};

const readDismiss = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
};
const writeDismiss = (signature: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, signature);
  } catch {
    /* ignore */
  }
};

const GlobalStatusBanner = () => {
  const { user, subscription, loading } = useAuth();
  const limits = useFreemiumLimits();
  const location = useLocation();
  const [dismissed, setDismissed] = useState<string | null>(() => readDismiss());

  // Re-read on route change in case of cross-tab updates
  useEffect(() => {
    setDismissed(readDismiss());
  }, [location.pathname]);

  const data = useMemo(() => {
    // 1. Guest mode (no auth) — show if any guest data and any quota is ≥66% used
    if (!user) {
      if (typeof window === "undefined") return null;
      if (!hasGuestData()) return null;
      const u = getGuestUsage();
      const pPct = u.patients.limit ? u.patients.used / u.patients.limit : 0;
      const aPct = u.appointments.limit ? u.appointments.used / u.appointments.limit : 0;
      const worst = Math.max(pPct, aPct);
      if (worst < 0.66) return null;
      const blocked = u.patients.remaining === 0 || u.appointments.remaining === 0;
      const counter = `${u.patients.used}/${u.patients.limit} pacientes · ${u.appointments.used}/${u.appointments.limit} consultas`;
      return {
        kind: "guest" as const,
        signature: `guest:${blocked ? "blocked" : "warn"}:${u.patients.used}:${u.appointments.used}`,
        severity: blocked ? ("danger" as const) : ("warn" as const),
        blocked,
        title: blocked
          ? `Você está bloqueado — limite do modo visitante atingido (${counter})`
          : `Modo visitante: ${counter}`,
        description: blocked
          ? "Crie sua conta grátis para continuar e levar tudo o que você criou."
          : "Crie sua conta grátis para subir para 5/5 e não perder seus dados.",
        ctaLabel: blocked ? "Desbloquear agora" : "Criar conta grátis",
        ctaTo: "/register?next=/sync-guest-data",
        counter,
      };
    }

    // Skip everything below while still loading subscription
    if (loading || subscription.loading) return null;

    // Skip for paid / admin (no nag once they're paying)
    if (limits.isAdmin) return null;

    // 3. Trial countdown (≤3 dias). Quando bate 0, vira "bloqueado".
    if (subscription.trialDaysRemaining > 0 && subscription.trialDaysRemaining <= 3) {
      const blocked = false; // ainda no trial, só conta regressiva
      return {
        kind: "trial" as const,
        signature: `trial:${subscription.trialDaysRemaining}`,
        severity: "warn" as const,
        blocked,
        title:
          subscription.trialDaysRemaining === 1
            ? "Seu trial termina amanhã"
            : `Seu trial termina em ${subscription.trialDaysRemaining} dias`,
        description: "Garanta o plano Essencial agora para não perder o acesso.",
        ctaLabel: "Assinar Essencial",
        ctaTo: "/upgrade?reason=trial_ending",
        counter: `${subscription.trialDaysRemaining} dia(s) restantes`,
      };
    }

    // 2. Free quota approaching limit (≥80% in any module)
    if (limits.isFree && !limits.isLoading) {
      const modules = limits.usageByModule;
      type Hit = { key: string; used: number; limit: number; label: string; pct: number; blocked: boolean };
      const hits: Hit[] = [
        { key: "patients", used: modules.patients.used, limit: modules.patients.limit, label: "pacientes", pct: modules.patients.percent, blocked: modules.patients.blocked },
        { key: "appointments", used: modules.appointments.used, limit: modules.appointments.limit, label: "consultas", pct: modules.appointments.percent, blocked: modules.appointments.blocked },
        { key: "financial", used: modules.financial.used, limit: modules.financial.limit, label: "lançamentos financeiros", pct: modules.financial.percent, blocked: modules.financial.blocked },
      ];
      const worst = hits.reduce((a, b) => (b.pct > a.pct ? b : a), hits[0]);
      if (worst.pct >= 80) {
        const counter = `${worst.used}/${worst.limit} ${worst.label}`;
        return {
          kind: "free-quota" as const,
          signature: `free:${worst.blocked ? "blocked" : "warn"}:${worst.key}:${worst.used}/${worst.limit}`,
          severity: worst.blocked ? ("danger" as const) : ("warn" as const),
          blocked: worst.blocked,
          title: worst.blocked
            ? `Você está bloqueado — limite grátis de ${worst.label} atingido (${counter})`
            : `Você usou ${counter} do plano grátis`,
          description: worst.blocked
            ? "Faça upgrade para Essencial para continuar cadastrando."
            : "Considere o upgrade antes de bater o limite e travar o cadastro.",
          ctaLabel: worst.blocked ? "Desbloquear agora" : "Upgrade Essencial",
          ctaTo: `/upgrade?reason=quota_${worst.key}`,
          counter,
        };
      }
    }

    return null;
  }, [user, loading, subscription, limits]);

  if (isHiddenRoute(location.pathname)) return null;
  if (!data) return null;
  if (dismissed === data.signature) return null;

  const Icon =
    data.blocked ? Lock : data.kind === "trial" ? Crown : data.kind === "guest" ? Users : AlertTriangle;
  const tone = data.blocked
    ? "border-destructive/50 bg-destructive/10"
    : data.severity === "danger"
      ? "border-destructive/40 bg-destructive/5"
      : "border-yellow-500/40 bg-yellow-500/5";
  const ctaTone = data.blocked
    ? "bg-destructive text-destructive-foreground"
    : "bg-primary text-primary-foreground";

  return (
    <div
      className={`px-3 sm:px-4 pt-2`}
      data-testid="global-status-banner"
      data-kind={data.kind}
      data-severity={data.severity}
      data-blocked={data.blocked ? "1" : "0"}
      data-counter={data.counter}
    >
      <div className={`mx-auto max-w-5xl rounded-xl border ${tone} p-3 sm:p-3.5 flex items-start gap-3`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/60">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight" data-testid="global-status-banner-title">
            {data.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{data.description}</p>
          <p
            className="text-[10px] mt-1 font-mono text-muted-foreground/80"
            data-testid="global-status-banner-counter"
          >
            {data.counter}
          </p>
        </div>
        <Link
          to={data.ctaTo}
          className={`hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold hover:opacity-90 ${ctaTone}`}
          data-testid="global-status-banner-cta"
          data-cta-to={data.ctaTo}
        >
          {data.blocked ? <Lock className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {data.ctaLabel}
        </Link>
        <button
          type="button"
          onClick={() => {
            writeDismiss(data.signature);
            setDismissed(data.signature);
          }}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Dispensar aviso"
          data-testid="global-status-banner-dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Mobile CTA below */}
      <div className="sm:hidden mx-auto max-w-5xl mt-2">
        <Link
          to={data.ctaTo}
          className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold ${ctaTone}`}
          data-testid="global-status-banner-cta-mobile"
        >
          {data.blocked ? <Lock className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {data.ctaLabel}
        </Link>
      </div>
    </div>
  );
};

export default GlobalStatusBanner;
