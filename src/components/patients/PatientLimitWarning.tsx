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
 * Aviso progressivo do limite de pacientes do plano gratuito (5 pacientes).
 * - count = limit - 1 (4): banner informativo discreto
 * - count = limit (5):     banner de urgência ("limite atingido")
 * - count > limit (modal): modal bloqueante quando o usuário tenta criar o 6º
 *
 * Mantém a mesma copy/CTA do PremiumFeatureModal padrão para consistência.
 */
const PatientLimitWarning = ({ count, limit, isFree, blockOpen, onBlockClose }: PatientLimitWarningProps) => {
  const navigate = useNavigate();
  const trackedRef = useRef<number>(0);

  useEffect(() => {
    if (!isFree) return;
    if ((count === limit - 1 || count === limit) && trackedRef.current < count) {
      trackLimitWarning(`view_patient_limit_warning_${count}`, count);
      trackedRef.current = count;
    }
  }, [count, limit, isFree]);

  if (!isFree) return null;

  const remaining = limit - count;

  // 1 paciente restante (count = 2 quando limit = 3)
  if (remaining === 1) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium">
            Falta apenas 1 paciente para atingir o limite do plano gratuito ({limit} pacientes).
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            No plano Essencial você tem pacientes ilimitados.
          </span>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 border-primary/40 text-primary"
            onClick={() => {
              trackCtaClick("fazer_upgrade", "patient_limit_warning_remaining_1");
              navigate("/upgrade?reason=patients");
            }}
          >
            Fazer upgrade
          </Button>
        </div>
      </div>
    );
  }

  // Limite atingido (count = 3 quando limit = 3) — mostra banner de urgência
  if (remaining === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="font-semibold">
            Você atingiu o limite de {limit} pacientes do plano gratuito.
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          O próximo cadastro será bloqueado. Faça upgrade para o plano Essencial e tenha pacientes ilimitados.
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="text-xs h-8 gradient-primary"
            onClick={() => {
              trackCtaClick("upgrade_essencial", "patient_limit_reached");
              navigate("/upgrade?reason=patients");
            }}
          >
            <Crown className="h-3.5 w-3.5 mr-1" />
            Assinar plano Essencial
          </Button>
          <Link
            to="/planos"
            className="text-xs text-muted-foreground hover:text-primary hover:underline"
            onClick={() => trackCtaClick("ver_planos", "patient_limit_reached")}
          >
            Comparar planos
          </Link>
        </div>
      </div>
    );
  }

  // Modal bloqueante (tentativa de criar mais que o limite)
  if (count > limit || (count === limit && blockOpen)) {
    return (
      <Dialog open={blockOpen} onOpenChange={(v) => !v && onBlockClose()}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border-primary/20">
          <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 px-6 pt-8 pb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Limite de pacientes atingido</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Você já cadastrou <span className="text-primary font-semibold">{limit}</span> pacientes — o máximo do plano gratuito. Para continuar, assine o plano Essencial.
            </p>
          </div>

          <div className="px-6 py-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Com o Essencial você desbloqueia:
            </p>
            <ul className="space-y-2">
              {[
                "Pacientes ilimitados",
                "Receitas e atestados digitais",
                "Teleconsulta integrada",
                "Diretório público de profissionais",
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
                trackCtaClick("upgrade_essencial", "patient_block_modal");
                onBlockClose();
                navigate("/upgrade?reason=patients");
              }}
              className="w-full gradient-primary font-semibold py-5"
            >
              <Crown className="h-4 w-4 mr-2" />
              Assinar plano Essencial por R$ 89/mês
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => {
                trackCtaClick("ver_planos", "patient_block_modal");
                onBlockClose();
                navigate("/planos");
              }}
            >
              Comparar planos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Antes do limite — banner discreto opcional (info)
  if (remaining === 2) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm">
        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">
          Plano gratuito: {count} de {limit} pacientes cadastrados.
        </span>
        <Link
          to="/planos"
          className="ml-auto text-xs text-primary hover:underline whitespace-nowrap"
          onClick={() => trackCtaClick("ver_planos", "patient_limit_info")}
        >
          Ver planos
        </Link>
      </div>
    );
  }

  return null;
};

export default PatientLimitWarning;
