import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PageContainer from "@/components/PageContainer";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  addGuestAppointment,
  deleteGuestAppointment,
  readGuestAppointments,
  GUEST_LIMITS,
  type GuestAppointment,
} from "@/lib/guestStorage";
import GuestLimitDialog from "@/components/guest/GuestLimitDialog";

const emptyForm = {
  patient_name: "",
  date: "",
  time: "",
  appointment_type: "presencial" as "presencial" | "online",
  notes: "",
};

const GuestAgenda = () => {
  const [list, setList] = useState<GuestAppointment[]>(() => readGuestAppointments());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [limitOpen, setLimitOpen] = useState(false);

  const reload = () => setList(readGuestAppointments());

  const handleAdd = () => {
    const result = addGuestAppointment(form);
    if (result.ok === false) {
      if (result.reason === "limit") {
        toast.error(
          `Limite do modo guest atingido (${GUEST_LIMITS.appointments} consultas). Crie sua conta grátis para subir para 5.`,
        );
      } else {
        toast.error("Preencha paciente, data e horário.");
      }
      return;
    }
    toast.success("Consulta agendada no modo guest.");
    setForm(emptyForm);
    setOpen(false);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteGuestAppointment(id);
    reload();
  };

  const blocked = list.length >= GUEST_LIMITS.appointments;
  // Sort: upcoming first
  const sorted = [...list].sort((a, b) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
  );

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
        data-testid="guest-agenda"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Agenda</h1>
            <p className="text-xs text-muted-foreground">
              Modo guest · {list.length}/{GUEST_LIMITS.appointments} consultas
            </p>
          </div>
          <Dialog
            open={open && !blocked}
            onOpenChange={(v) => {
              if (v && blocked) {
                setLimitOpen(true);
                return;
              }
              setOpen(v);
            }}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="gradient-primary"
                onClick={(e) => {
                  if (blocked) {
                    e.preventDefault();
                    setLimitOpen(true);
                  }
                }}
                data-testid="guest-agenda-new-btn"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nova
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Nova consulta (guest)</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Paciente *</Label>
                  <Input
                    value={form.patient_name}
                    onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Data *</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Horário *</Label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select
                    value={form.appointment_type}
                    onValueChange={(v: "presencial" | "online") =>
                      setForm({ ...form, appointment_type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Notas</Label>
                  <Textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <Button onClick={handleAdd} className="w-full gradient-primary">
                  Salvar consulta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {blocked && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            Você atingiu o limite do modo guest.{" "}
            <Link to="/register?next=/dashboard/agenda" className="font-semibold text-primary underline">
              Crie sua conta grátis
            </Link>{" "}
            para agendar mais consultas.
          </div>
        )}

        {sorted.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="Sem consultas ainda"
            description="Agende sua primeira consulta para testar a agenda."
            actionLabel="Agendar consulta"
            onAction={() => setOpen(true)}
          />
        ) : (
          <div className="space-y-2">
            {sorted.map((a) => {
              let formatted = a.date;
              try {
                formatted = format(new Date(`${a.date}T00:00`), "dd 'de' MMM", { locale: ptBR });
              } catch {
                /* keep raw */
              }
              return (
                <div key={a.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-col items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{a.patient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatted} · {a.time} · {a.appointment_type}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(a.id)}
                    aria-label={`Remover consulta de ${a.patient_name}`}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <GuestLimitDialog
        open={limitOpen}
        onOpenChange={setLimitOpen}
        scope="appointments"
        limit={GUEST_LIMITS.appointments}
      />
    </PageContainer>
  );
};

export default GuestAgenda;
