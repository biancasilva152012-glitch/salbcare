import { Link } from "react-router-dom";
import { Crown, UserPlus, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GuestLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "patients" | "appointments" — drives copy + CTA destination */
  scope: "patients" | "appointments";
  limit: number;
}

/**
 * Hard-stop modal shown when a guest tries to open the "Novo Paciente" /
 * "Nova Consulta" form after hitting the visitor quota. Replaces the silent
 * `disabled` button so the user always sees a clear CTA → registo / upgrade.
 */
const GuestLimitDialog = ({ open, onOpenChange, scope, limit }: GuestLimitDialogProps) => {
  const isPatients = scope === "patients";
  const label = isPatients ? "pacientes" : "consultas";
  const nextPath = isPatients ? "/dashboard/pacientes" : "/dashboard/agenda";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="guest-limit-dialog">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            Limite do modo visitante atingido
          </DialogTitle>
          <DialogDescription className="text-center">
            Você já cadastrou <strong>{limit}/{limit} {label}</strong> no modo visitante.
            Crie sua conta grátis ou ative o plano Essencial para continuar sem limites.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Button asChild className="w-full gradient-primary font-semibold">
            <Link to={`/register?next=${encodeURIComponent(nextPath)}`}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              Criar conta grátis (5/5)
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full font-semibold">
            <Link to="/upgrade?reason=guest_limit">
              <Sparkles className="h-4 w-4 mr-1.5" />
              Ver plano Essencial (sem limite)
            </Link>
          </Button>
        </div>

        <DialogFooter className="sm:justify-center">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Continuar no modo visitante
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuestLimitDialog;
