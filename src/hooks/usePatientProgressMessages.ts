import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { trackLimitWarning } from "@/hooks/useTracking";

/**
 * Mensagens de celebração ao cadastrar pacientes no plano gratuito (limite=3).
 * Cada mensagem dispara apenas 1x por sessão.
 */
export function usePatientProgressMessages(count: number, isFree: boolean) {
  const shownRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!isFree || count === 0) return;

    const messages: Record<number, string> = {
      1: "Primeiro paciente cadastrado! 🎉 Você já começou.",
      2: "Bom ritmo! Mais 1 paciente disponível no plano gratuito 📋",
    };

    const msg = messages[count];
    if (msg && !shownRef.current.has(count)) {
      shownRef.current.add(count);
      toast.success(msg, { duration: 4000 });
      trackLimitWarning(`patient_milestone_${count}`, count);
    }
  }, [count, isFree]);
}
