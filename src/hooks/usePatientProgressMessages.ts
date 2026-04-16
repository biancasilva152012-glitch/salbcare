import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { trackLimitWarning } from "@/hooks/useTracking";

/**
 * Shows celebratory progress toasts after the 2nd and 3rd patient.
 * Each message fires only once per session via ref tracking.
 */
export function usePatientProgressMessages(count: number, isFree: boolean) {
  const shownRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!isFree || count === 0) return;

    const messages: Record<number, string> = {
      1: "Primeiro paciente cadastrado! 🎉 Você já começou.",
      2: "Profissionais ativos geralmente têm vários pacientes cadastrados 📋",
      3: "Você já começou a organizar sua base! 💪",
      5: "Metade do limite gratuito alcançada. Continue crescendo! 📈",
    };

    const msg = messages[count];
    if (msg && !shownRef.current.has(count)) {
      shownRef.current.add(count);
      toast.success(msg, { duration: 4000 });
      trackLimitWarning(`patient_milestone_${count}`, count);
    }
  }, [count, isFree]);
}
