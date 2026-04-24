import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Crown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { trackLimitWarning, trackCtaClick } from "@/hooks/useTracking";

interface PatientLimitWarningProps {
  count: number;
  limit: number;
  isFree: boolean;
  blockOpen: boolean;
  onBlockClose: () => void;
}

/**
 * Progressive warning system for patient limits:
 * - 8th patient: subtle info banner
 * - 9th patient: attention banner
 * - 10th patient: urgency banner
 * - 11th+ (blocked): mandatory modal
 */
const PatientLimitWarning = ({ count, limit, isFree, blockOpen, onBlockClose }: PatientLimitWarningProps) => {
  const navigate = useNavigate();
  const trackedRef = useRef<number>(0);

  // Fire tracking events once per threshold
  useEffect(() => {
    if (!isFree) return;
    if (count >= limit - 2 && count <= limit && trackedRef.current < count) {
      const eventMap: Record<number, string> = {
        [limit - 2]: "view_limit_warning_8",
        [limit - 1]: "view_limit_warning_9",
        [limit]: "view_limit_warning_10",
      };
      const event = eventMap[count];
      if (event) trackLimitWarning(event, count);
      trackedRef.current = count;
    }
  }, [count, limit, isFree]);

  if (!isFree) return null;

  const remaining = limit - count;

  // 8th patient — subtle info
  if (remaining === 2) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm">
        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">
          Você está se aproximando do limite do plano gratuito ({limit} pacientes).
        </span>
        <Link
          to="/planos"
          className="ml-auto text-xs text-primary hover:underline whitespace-nowrap"
          onClick={() => trackCtaClick("ver_planos", "limit_warning_8")}
        >
          Ver planos
        </Link>
      </div>
    );
  }

  // 9th patient — attention
  if (remaining === 1) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium">Falta apenas 1 paciente para atingir o limite do plano gratuito.</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Evite interrupções — faça upgrade para continuar cadastrando sem limites.
          </span>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 border-primary/40 text-primary"
            onClick={() => {
              trackCtaClick("fazer_upgrade", "limit_warning_9");
              navigate("/checkout?plan=basic");
            }}
          >
            Fazer upgrade
          </Button>
        </div>
      </div>
    );
  }

  // 10th patient — urgency
  if (remaining === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="font-semibold">Você atingiu o limite do plano gratuito.</span>
        </div>
        <p className="text-xs text-muted-foreground">
          O próximo cadastro será bloqueado. Faça upgrade para continuar sem interrupções.
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="text-xs h-8 gradient-primary"
            onClick={() => {
              trackCtaClick("upgrade_essencial", "limit_warning_10");
              navigate("/checkout?plan=basic");
            }}
          >
            <Crown className="h-3.5 w-3.5 mr-1" />
            Fazer upgrade para o Essencial
          </Button>
          <Link
            to="/planos"
            className="text-xs text-muted-foreground hover:text-primary hover:underline"
            onClick={() => trackCtaClick("ver_planos", "limit_warning_10")}
          >
            Ver planos
          </Link>
        </div>
      </div>
    );
  }

  // Block modal (11th+ patient)
  return (
    <Dialog open={blockOpen} onOpenChange={(v) => !v && onBlockClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-primary/20">
        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 px-6 pt-8 pb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Limite atingido</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Você já cadastrou <span className="text-primary font-semibold">{limit}</span> pacientes no plano gratuito.
            Para continuar adicionando novos pacientes e acessar todos os recursos, faça upgrade para o plano Essencial.
          </p>
        </div>

        <div className="px-6 py-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Com o Essencial você tem:
          </p>
          <ul className="space-y-2">
            {[
              "Pacientes ilimitados",
              "Agenda completa",
              "Histórico e evolução",
              "Mais recursos profissionais",
            ].map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 pb-6 space-y-2">
          <Button
            onClick={() => {
              trackCtaClick("upgrade_essencial", "limit_block_modal");
              trackLimitWarning("hit_free_limit_10", count);
              onBlockClose();
              navigate("/upgrade?reason=patients");
            }}
            className="w-full gradient-primary font-semibold py-5"
          >
            <Crown className="h-4 w-4 mr-2" />
            Fazer upgrade para o Essencial
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => {
              trackCtaClick("ver_planos", "limit_block_modal");
              onBlockClose();
              navigate("/planos");
            }}
          >
            Ver planos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientLimitWarning;
