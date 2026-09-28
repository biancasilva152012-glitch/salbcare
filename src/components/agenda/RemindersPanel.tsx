import { useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { buildPatientWhatsAppUrl, patientMessage } from "@/lib/agenda/whatsappMessages";
import { useState } from "react";

type Apt = { id: string; patient_name: string; patient_id: string | null; date: string; time: string; appointment_type: string; status: string };

/** Lembretes de hoje e amanhã. Envio por toque (abre o WhatsApp). Marcações de enviado ficam neste aparelho. */
const RemindersPanel = ({ appointments, professionalName }: { appointments: Apt[]; professionalName: string }) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const due = appointments
    .filter((a) => (a.date === today || a.date === tomorrow) && a.appointment_type !== "blocked" && !["completed", "no_show", "cancelled"].includes(a.status))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const ids = due.map((a) => a.patient_id).filter(Boolean) as string[];
  const { data: phones = {} } = useQuery({
    queryKey: ["reminder-phones", ids.join(",")],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("id, phone").in("id", ids);
      return Object.fromEntries((data || []).map((p) => [p.id, p.phone]));
    },
    enabled: ids.length > 0,
  });
  const [sent, setSent] = useState<Record<string, boolean>>(() => JSON.parse(localStorage.getItem("salbcare_reminders_sent") || "{}"));

  if (due.length === 0) return null;
  const send = (a: Apt) => {
    const text = patientMessage("lembrete", { patient: a.patient_name, date: a.date, time: a.time, professional: professionalName, online: a.appointment_type === "telehealth" });
    window.open(buildPatientWhatsAppUrl(a.patient_id ? phones[a.patient_id] : null, text), "_blank", "noopener");
    const next = { ...sent, [a.id]: true };
    setSent(next);
    localStorage.setItem("salbcare_reminders_sent", JSON.stringify(next));
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="admin-eyebrow">Lembretes para enviar</p>
      <p className="mb-2 text-xs text-muted-foreground">Consultas de hoje e amanhã. Um toque abre o WhatsApp com o lembrete pronto.</p>
      <div className="space-y-2">
        {due.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{a.patient_name}</p>
              <p className="font-mono text-xs text-muted-foreground">{a.date === today ? "Hoje" : "Amanhã"} {a.time.slice(0, 5)}</p>
            </div>
            <Button size="sm" variant={sent[a.id] ? "outline" : "default"} className="h-10 shrink-0" onClick={() => send(a)}>
              {sent[a.id] ? "Enviado" : "Enviar lembrete"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RemindersPanel;
