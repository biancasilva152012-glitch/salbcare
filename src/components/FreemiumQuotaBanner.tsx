import { Link } from "react-router-dom";
import { AlertTriangle, Crown, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { trackCtaClick } from "@/hooks/useTracking";
import type { FreemiumModuleUsage } from "@/hooks/useFreemiumLimits";

interface Props {
  /** Visible label (e.g. "Consultas", "Teleconsultas"). */
  label: string;
  /** Pre-computed usage from the unified `useFreemiumLimits` hook. */
  usage: FreemiumModuleUsage;
  /** Whether the user is on the free tier — banner is hidden for paid users. */
  isFree: boolean;
  /**
   * Tracking key — appended to limit_warning / limit_blocked events.
   * Examples: "appointments", "telehealth".
   */
  trackingKey: string;
}

/**
 * Generic per-module quota banner used by the contextual paywall in Agenda
 * and Telehealth. Mirrors the progressive UX of `PatientLimitWarning`:
 *   - 40-79% used → silent (returns null)
 *   - 80%+ used → soft info banner with a Progress bar
 *   - blocked → red urgency banner with upgrade CTA
 *
 * Reading and editing remain fully open even when blocked — only the
 * "create" action is gated by the consuming page.
 */
export default function FreemiumQuotaBanner({ label, usage, isFree, trackingKey }: Props) {
  if (!isFree) return null;
  if (usage.percent < 80 && !usage.blocked) return null;

  const remaining = usage.remaining;

  if (usage.blocked) {
    return (
      <div
        role="alert"
        data-testid={`quota-banner-${trackingKey}-blocked`}
        className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="font-medium">
            Você atingiu o limite gratuito de {usage.limit} {label.toLowerCase()} este mês.
          </span>
        </div>
        <Progress value={100} className="h-1.5" />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Continue navegando e editando — apenas a criação está pausada.
          </span>
          <Button asChild size="sm" className="gradient-primary text-xs h-7 gap-1">
            <Link
              to="/upgrade"
              onClick={() => trackCtaClick("upgrade_from_quota", `${trackingKey}_blocked`)}
            >
              <Crown className="h-3 w-3" /> Liberar
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={`quota-banner-${trackingKey}-warning`}
      className="space-y-1.5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm"
    >
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <span className="font-medium">
          {remaining === 1
            ? `Falta apenas 1 ${label.toLowerCase().replace(/s$/, "")} para o limite gratuito`
            : `Você está usando ${usage.used}/${usage.limit} ${label.toLowerCase()} este mês`}
          .
        </span>
      </div>
      <Progress value={usage.percent} className="h-1.5" />
    </div>
  );
}
