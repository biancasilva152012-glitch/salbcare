import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import RemindersPanel from "@/components/agenda/RemindersPanel";
import { buildPatientWhatsAppUrl, patientMessage, type PatientMessageKind } from "@/lib/agenda/whatsappMessages";

type Apt = { id: string; patient_name: string; patient_id: string | null; date: string; time: string; appointment_type: string; status: string };

const Agendamentos = () => {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", user?.id, "upcoming"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, patient_name, patient_id, date, time, appointment_type, status")
        .eq("user_id", user!.id)
        .gte("date", today)
        .neq("status", "cancelled")
        .neq("appointment_type", "blocked")
        .order("date").order("time").limit(100);
      return (data || []) as Apt[];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["agenda-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });
  const professional = profile?.name || "";

  const ids = appointments.map((a) => a.patient_id).filter(Boolean) as string[];
  const { data: phones = {} } = useQuery({
    queryKey: ["agendamentos-phones", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("id, phone").in("id", ids);
      return Object.fromEntries((data || []).map((p) => [p.id, p.phone])) as Record<string, string | null>;
    },
  });

  const send = (a: Apt, kind: PatientMessageKind) => {
    const text = patientMessage(kind, { patient: a.patient_name, date: a.date, time: a.time, professional, online: a.appointment_type === "telehealth" });
    window.open(buildPatientWhatsAppUrl(a.patient_id ? phones[a.patient_id] : null, text), "_blank", "noopener");
  };

  return (
    <PageContainer className="admin-theme" backTo="/dashboard/agenda">
      <p className="admin-eyebrow">Agenda</p>
      <h1 className="font-heading text-2xl font-semibold">Agendamentos</h1>
      <p className="mb-4 text-sm text-muted-foreground">Próximas consultas, com confirmação e lembrete pelo WhatsApp.</p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Button asChild className="h-12"><Link to="/dashboard/agenda">Nova consulta</Link></Button>
        <Button asChild variant="outline" className="h-12"><Link to="/dashboard/agenda">Ver calendário</Link></Button>
      </div>

      <div className="mb-4">
        <RemindersPanel appointments={appointments} professionalName={professional} />
      </div>

      <p className="admin-eyebrow mb-2">Próximas consultas</p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : appointments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhuma consulta marcada. Toque em Nova consulta para começar.</p>
      ) : (
        <div className="space-y-2">
          {appointments.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-3">
              <p className="truncate font-medium">{a.patient_name}</p>
              <p className="mb-2 text-xs capitalize text-muted-foreground">
                {format(parse(a.date, "yyyy-MM-dd", new Date()), "EEE, d 'de' MMM", { locale: ptBR })} às <span className="font-mono">{a.time.slice(0, 5)}</span>
                {a.patient_id && !phones[a.patient_id] ? " · sem telefone" : ""}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-11" onClick={() => send(a, "confirmacao")}>Confirmação</Button>
                <Button variant="outline" className="h-11" onClick={() => send(a, "lembrete")}>Lembrete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default Agendamentos;
