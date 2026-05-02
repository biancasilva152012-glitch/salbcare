import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import PageContainer from "@/components/PageContainer";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useFreemiumLimits, FREE_LIMITS } from "@/hooks/useFreemiumLimits";
import { getGuestUsage, GUEST_LIMITS } from "@/lib/guestStorage";
import { PLANS } from "@/config/plans";

/**
 * /dashboard/limites — single source of truth showing how much of the free
 * quota the user has consumed AND a side-by-side comparison with the paid
 * Essencial plan. Works for both guest (localStorage) and free authenticated
 * users; paid users see a confirmation card instead.
 */
const DashboardLimits = () => {
  const { user, subscription } = useAuth();
  const limits = useFreemiumLimits();

  const isGuest = !user;
  const isPaid = limits.isPaid;

  // Build the "current usage" rows from the right source
  const usageRows = isGuest
    ? (() => {
        const u = getGuestUsage();
        return [
          {
            label: "Pacientes",
            used: u.patients.used,
            limit: GUEST_LIMITS.patients,
            blocked: u.patients.remaining <= 0,
          },
          {
            label: "Consultas",
            used: u.appointments.used,
            limit: GUEST_LIMITS.appointments,
            blocked: u.appointments.remaining <= 0,
          },
          {
            label: "Mentoria com IA",
            used: 0,
            limit: 0,
            blocked: true,
            note: "Disponível só após criar conta",
          },
        ];
      })()
    : [
        {
          label: "Pacientes",
          used: limits.patientsCount,
          limit: limits.patientsLimit,
          blocked: !limits.canAddPatient,
        },
        {
          label: "Consultas (mês)",
          used: limits.appointmentsCount,
          limit: limits.appointmentsLimit,
          blocked: !limits.canAddAppointment,
        },
        {
          label: "Mentoria com IA (mês)",
          used: limits.mentorshipCount,
          limit: limits.mentorshipLimit,
          blocked: !limits.canSendMentorship,
        },
      ];

  const essencial = PLANS.basic;

  return (
    <>
      <SEOHead
        title="Meus limites e plano | SALBCARE"
        description="Veja quanto do seu plano gratuito já usou e compare com o plano Essencial."
        canonical="/dashboard/limites"
      />
      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
          data-testid="dashboard-limits"
        >
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Link to="/dashboard" aria-label="Voltar ao dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Meus limites</h1>
              <p className="text-xs text-muted-foreground">
                {isPaid
                  ? "Você está no plano Essencial — sem limites."
                  : isGuest
                  ? "Você está em modo guest. Crie conta grátis para subir os limites."
                  : "Plano Grátis — veja o que falta para precisar do Essencial."}
              </p>
            </div>
          </div>

          {/* Uso atual */}
          <section
            className="glass-card p-4 space-y-4"
            aria-labelledby="usage-heading"
            data-testid="usage-section"
          >
            <h2 id="usage-heading" className="text-sm font-semibold">
              Uso atual
            </h2>
            <div className="space-y-3">
              {usageRows.map((row) => {
                const pct =
                  row.limit === 0 ? 100 : Math.min(100, (row.used / row.limit) * 100);
                return (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-medium">{row.label}</span>
                      <span
                        className={`font-mono text-[11px] ${
                          row.blocked ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {row.limit === 0 ? "bloqueado" : `${row.used}/${row.limit}`}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-1.5 ${row.blocked ? "[&>div]:bg-destructive" : ""}`}
                    />
                    {row.note && (
                      <p className="text-[11px] text-muted-foreground">{row.note}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Comparação de planos */}
          <section
            className="grid gap-3 sm:grid-cols-2"
            aria-labelledby="plans-heading"
            data-testid="plans-section"
          >
            <h2 id="plans-heading" className="sr-only">
              Comparação de planos
            </h2>

            {/* Plano Grátis */}
            <div className="glass-card p-4 space-y-3 border-border/60">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Grátis</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isGuest ? "Modo guest ativo" : "Plano atual"}
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold">
                R$ 0<span className="text-xs font-normal text-muted-foreground">/mês</span>
              </p>
              <ul className="space-y-1.5 text-xs">
                <FeatureLine
                  ok
                  text={
                    isGuest
                      ? `${GUEST_LIMITS.patients} pacientes (modo guest)`
                      : `${FREE_LIMITS.patients} pacientes`
                  }
                />
                <FeatureLine
                  ok
                  text={
                    isGuest
                      ? `${GUEST_LIMITS.appointments} consultas (modo guest)`
                      : `${FREE_LIMITS.appointments} consultas/mês`
                  }
                />
                <FeatureLine
                  ok={!isGuest}
                  text={
                    isGuest
                      ? "Mentoria com IA (após criar conta)"
                      : `${FREE_LIMITS.mentorshipMessages} msgs de mentoria/mês`
                  }
                />
                <FeatureLine ok={false} text="Telessaúde" />
                <FeatureLine ok={false} text="Receitas/atestados digitais" />
              </ul>
              {isGuest && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/register?next=/dashboard/limites">Criar conta grátis</Link>
                </Button>
              )}
            </div>

            {/* Plano Essencial */}
            <div
              className={`glass-card p-4 space-y-3 border-2 ${
                isPaid ? "border-primary" : "border-primary/40"
              } relative`}
            >
              <span className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                Recomendado
              </span>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                  <Crown className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{essencial.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isPaid ? "Seu plano atual" : "Tudo ilimitado"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  R$ {essencial.price}
                  <span className="text-xs font-normal text-muted-foreground">/mês</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  ou R$ {essencial.annualPrice}/mês no anual
                </p>
              </div>
              <ul className="space-y-1.5 text-xs">
                {essencial.features.slice(0, 6).map((f) => (
                  <FeatureLine key={f} ok text={f} />
                ))}
              </ul>
              {!isPaid && (
                <Button
                  asChild
                  size="sm"
                  className="w-full gradient-primary font-semibold"
                  data-testid="upgrade-cta"
                >
                  <Link to="/upgrade?reason=limits_page">
                    <Crown className="h-3.5 w-3.5 mr-1.5" />
                    {subscription.trialDaysRemaining > 0
                      ? "Continuar no Essencial"
                      : "Atualizar agora"}
                  </Link>
                </Button>
              )}
              {isPaid && (
                <div className="rounded-lg bg-primary/10 px-3 py-2 text-center text-xs font-medium text-primary">
                  ✓ Você já tem acesso ilimitado
                </div>
              )}
            </div>
          </section>
        </motion.div>
      </PageContainer>
    </>
  );
};

const FeatureLine = ({ ok, text }: { ok: boolean; text: string }) => (
  <li className="flex items-start gap-2">
    {ok ? (
      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
    ) : (
      <X className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
    )}
    <span className={ok ? "" : "text-muted-foreground/70 line-through"}>{text}</span>
  </li>
);

export default DashboardLimits;
