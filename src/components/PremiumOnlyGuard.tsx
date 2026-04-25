import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Crown, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import GuestPaywall from "@/components/GuestPaywall";
import { PLANS } from "@/config/plans";

interface PremiumOnlyGuardProps {
  /** Friendly module name shown in copy (e.g. "a Mentora IA") */
  feature: string;
  /** Optional pitch shown below the title */
  description?: string;
  /** Where to redirect after sign-up / upgrade success */
  redirectAfter?: string;
  /** Reason code forwarded to /upgrade?reason=... */
  reason?:
    | "telehealth"
    | "mentorship"
    | "accounting"
    | "legal"
    | "premium_required";
  children: React.ReactNode;
}

/**
 * Single source of truth for "must be on the paid plan" pages.
 *
 * Rendering matrix:
 * - No auth user (guest)        → <GuestPaywall> (sign-up CTA first)
 * - Authenticated but FREE plan → upgrade screen (Crown CTA → /upgrade)
 * - Paid / trial / admin        → renders children
 *
 * Replaces the ad-hoc "if (!user) return <GuestPaywall .../>" pattern
 * scattered in Telehealth/Mentoria/Accounting/Legal so we never let a free
 * user slip through.
 */
const PremiumOnlyGuard = ({
  feature,
  description,
  redirectAfter,
  reason = "premium_required",
  children,
}: PremiumOnlyGuardProps) => {
  const { user, subscription } = useAuth();
  const { isPaid, isAdmin, isLoading } = useFreemiumLimits();

  // 1. Guest visitor — paywall focused on conversion to free account first
  if (!user) {
    return (
      <GuestPaywall
        feature={feature}
        description={description}
        redirectAfterSignup={redirectAfter ?? "/dashboard"}
      />
    );
  }

  // 2. Wait for the subscription check to land before deciding (avoids flash)
  if (subscription.loading || isLoading) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-md py-10 text-center text-sm text-muted-foreground">
          Carregando…
        </div>
      </PageContainer>
    );
  }

  // 3. Authenticated paying user / admin — full access
  if (isPaid || isAdmin) return <>{children}</>;

  // 4. Authenticated FREE user — upgrade gate
  const essencial = PLANS.basic;
  const upgradeHref = `/upgrade?reason=${encodeURIComponent(reason)}`;
  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md text-center space-y-4 py-8"
        data-testid="premium-only-guard"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold">{feature} é do plano Essencial</h1>
          <p className="text-sm text-muted-foreground">
            {description ??
              `Esse módulo está incluído no plano ${essencial.name} (R$ ${essencial.price}/mês). Faça upgrade para liberar.`}
          </p>
        </div>

        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">
            Plano {essencial.name} — R$ {essencial.price}/mês
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {essencial.features.slice(0, 4).map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 pt-1">
          <Button asChild className="w-full gradient-primary font-semibold">
            <Link to={upgradeHref} data-testid="premium-upgrade-cta">
              <Crown className="h-4 w-4 mr-2" />
              Atualizar para o Essencial
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard/limites">
              Ver meus limites
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="w-full text-muted-foreground">
            <Link to="/dashboard">Voltar ao dashboard</Link>
          </Button>
        </div>
      </motion.div>
    </PageContainer>
  );
};

export default PremiumOnlyGuard;

// Re-export for tests / convenience
export { GuestPaywall };
export type { PremiumOnlyGuardProps };
// Sanity import to avoid unused imports if features change
void UserPlus;
