import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getGuestUsage, GUEST_LIMITS } from "@/lib/guestStorage";

/**
 * Sticky-ish banner shown only on /dashboard (home) when the visitor is in
 * guest mode (no auth). Surfaces remaining quota for patients/appointments
 * and a hard-stop reminder that mentoria/telessaúde require an account.
 *
 * Reads usage synchronously from localStorage on every render — that's fine
 * because the dashboard re-mounts on every navigation and the numbers are
 * tiny (3/3). Avoids a useEffect just for this.
 */
const GuestBanner = () => {
  const usage = getGuestUsage();

  const items = [
    { label: "Pacientes", used: usage.patients.used, limit: usage.patients.limit },
    { label: "Consultas", used: usage.appointments.used, limit: usage.appointments.limit },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 space-y-3"
      data-testid="guest-banner"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">
            Você está testando em modo guest
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crie uma conta grátis para salvar seus dados e desbloquear mais limites
            ({GUEST_LIMITS.patients} pacientes e {GUEST_LIMITS.appointments} consultas
            agora — 5/5/5 com cadastro).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => {
          const pct = Math.min(100, (it.used / it.limit) * 100);
          return (
            <div key={it.label} className="space-y-1.5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-muted-foreground">{it.label}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {it.used}/{it.limit}
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button asChild size="sm" className="gradient-primary font-semibold flex-1">
          <Link to="/register?next=/dashboard">
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Criar conta grátis
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link to="/upgrade">Ver plano Essencial</Link>
        </Button>
      </div>
    </motion.div>
  );
};

export default GuestBanner;
