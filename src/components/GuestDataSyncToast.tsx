import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  readGuestPatients,
  readGuestAppointments,
  GUEST_STORAGE,
} from "@/lib/guestStorage";

const ACK_KEY = "salbcare_guest_data_notice_ack";

/**
 * Shown once when an authenticated user lands and we still have leftover
 * guest data in localStorage. We don't auto-import — per UX decision we
 * just inform them so they can manually decide later.
 *
 * Sets ACK_KEY after firing so we don't spam the toast on every navigation.
 */
const GuestDataSyncToast = () => {
  const { user, loading } = useAuth();
  const fired = useRef(false);

  useEffect(() => {
    if (loading || !user || fired.current) return;
    if (typeof window === "undefined") return;

    const acked = window.localStorage.getItem(ACK_KEY);
    if (acked) return;

    const patients = readGuestPatients().length;
    const appts = readGuestAppointments().length;
    if (patients === 0 && appts === 0) return;

    fired.current = true;
    window.localStorage.setItem(ACK_KEY, "1");

    const parts: string[] = [];
    if (patients) parts.push(`${patients} paciente${patients > 1 ? "s" : ""}`);
    if (appts) parts.push(`${appts} consulta${appts > 1 ? "s" : ""}`);

    toast.info(
      `Você tinha ${parts.join(" e ")} salvos no modo guest. Eles continuam no seu navegador — recadastre na sua conta para sincronizar.`,
      {
        duration: 8000,
        action: {
          label: "Limpar guest",
          onClick: () => {
            try {
              for (const key of Object.values(GUEST_STORAGE)) {
                window.localStorage.removeItem(key);
              }
              toast.success("Dados do modo guest removidos.");
            } catch {
              /* ignore */
            }
          },
        },
      },
    );
  }, [user, loading]);

  return null;
};

export default GuestDataSyncToast;
