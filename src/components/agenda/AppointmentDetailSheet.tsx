import { useQuery } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { buildPatientWhatsAppUrl, patientMessage, type PatientMessageKind } from "@/lib/agenda/whatsappMessages";

export type DetailAppointment = {
  id: string; patient_name: string; patient_id: string | null; date: string; time: string;
  appointment_type: string; notes: string | null; status: string;
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendada", confirmed: "Confirmada", completed: "Atendida", no_show: "Faltou",
  aguardando_confirmacao: "Aguardando confirmação", aguardando_comprovante: "Aguardando comprovante",
};

type Props = {
  appointment: DetailAppointment | null;
  conflicts: number;
  professionalName: string;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onStatus: (status: string) => void;
};

const AppointmentDetailSheet = ({ appointment: a, conflicts, professionalName, onClose, onEdit, onCancel, onStatus }: Props) => {
  const { data: phone } = useQuery({
    queryKey: ["patient-phone", a?.patient_id],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("phone").eq("id", a!.patient_id!).maybeSingle();
      return data?.phone ?? null;
    },
    enabled: !!a?.patient_id,
  });

  if (!a) return null;
  const when = format(parse(a.date, "yyyy-MM-dd", new Date()), "EEEE, d 'de' MMMM", { locale: ptBR });
  const send = (kind: PatientMessageKind) => {
    const text = patientMessage(kind, { patient: a.patient_name, date: a.date, time: a.time, professional: professionalName, online: a.appointment_type === "telehealth" });
    window.open(buildPatientWhatsAppUrl(phone, text), "_blank", "noopener");
  };

  return (
    <Sheet open={!!a} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="admin-theme max-h-[90vh] overflow-y-auto rounded-t-2xl bg-card text-foreground">
        <SheetHeader className="text-left">
          <SheetTitle>{a.patient_name}</SheetTitle>
          <SheetDescription className="capitalize">{when} às <span className="font-mono">{a.time.slice(0, 5)}</span></SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2 text-sm">
          <p><span className="text-muted-foreground">Status: </span>{STATUS_LABEL[a.status] ?? a.status}</p>
          <p><span className="text-muted-foreground">Tipo: </span>{a.appointment_type === "telehealth" ? "Online" : "Presencial"}</p>
          <p><span className="text-muted-foreground">WhatsApp: </span>{phone || "sem telefone no cadastro"}</p>
          {a.notes && <p><span className="text-muted-foreground">Notas: </span>{a.notes}</p>}
          {conflicts > 0 && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-destructive">
              Esta consulta se sobrepõe a {conflicts} {conflicts === 1 ? "outra" : "outras"} no mesmo horário.
            </p>
          )}
        </div>

        <p className="admin-eyebrow mt-5">WhatsApp</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="outline" className="h-12" onClick={() => send("confirmacao")}>Enviar confirmação</Button>
          <Button variant="outline" className="h-12" onClick={() => send("lembrete")}>Enviar lembrete</Button>
          <Button variant="outline" className="h-12" onClick={() => send("remarcacao")}>Propor remarcação</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Abre o seu WhatsApp com a mensagem pronta. É só tocar em enviar.</p>

        <p className="admin-eyebrow mt-5">Ações</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button className="h-12" onClick={() => onStatus("confirmed")}>Confirmada</Button>
          <Button variant="outline" className="h-12" onClick={() => onStatus("completed")}>Atendida</Button>
          <Button variant="outline" className="h-12" onClick={() => onStatus("no_show")}>Faltou</Button>
          <Button variant="outline" className="h-12" onClick={onEdit}>Editar ou remarcar</Button>
          <Button variant="outline" className="col-span-2 h-12 text-destructive" onClick={onCancel}>Cancelar consulta</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AppointmentDetailSheet;
