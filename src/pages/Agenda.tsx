import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Clock, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageContainer from "@/components/PageContainer";

interface Appointment {
  id: number;
  patient: string;
  date: string;
  time: string;
  type: "presencial" | "telehealth";
  notes: string;
  status: "scheduled" | "completed" | "cancelled";
}

const initialAppointments: Appointment[] = [
  { id: 1, patient: "Maria Santos", date: "2026-03-12", time: "09:00", type: "presencial", notes: "Retorno", status: "scheduled" },
  { id: 2, patient: "João Oliveira", date: "2026-03-12", time: "10:30", type: "telehealth", notes: "Primeira consulta", status: "scheduled" },
  { id: 3, patient: "Ana Costa", date: "2026-03-12", time: "14:00", type: "presencial", notes: "", status: "scheduled" },
  { id: 4, patient: "Pedro Lima", date: "2026-03-13", time: "09:00", type: "telehealth", notes: "Acompanhamento", status: "scheduled" },
  { id: 5, patient: "Carla Souza", date: "2026-03-13", time: "11:00", type: "presencial", notes: "", status: "scheduled" },
];

const Agenda = () => {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newApt, setNewApt] = useState<{ patient: string; date: string; time: string; type: "presencial" | "telehealth"; notes: string }>({ patient: "", date: "", time: "", type: "presencial", notes: "" });

  const filtered = appointments.filter(
    (a) => a.status !== "cancelled" && a.patient.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, Appointment[]>>((acc, a) => {
    (acc[a.date] = acc[a.date] || []).push(a);
    return acc;
  }, {});

  const handleAdd = () => {
    setAppointments([...appointments, { ...newApt, id: Date.now(), status: "scheduled" }]);
    setNewApt({ patient: "", date: "", time: "", type: "presencial", notes: "" });
    setOpen(false);
  };

  const handleCancel = (id: number) => {
    setAppointments(appointments.map((a) => (a.id === id ? { ...a, status: "cancelled" as const } : a)));
  };

  return (
    <PageContainer>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Agenda</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary gap-1">
                <Plus className="h-4 w-4" /> Nova
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Nova Consulta</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label>Paciente</Label>
                  <Input placeholder="Nome do paciente" value={newApt.patient} onChange={(e) => setNewApt({ ...newApt, patient: e.target.value })} className="bg-accent border-border" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Data</Label>
                    <Input type="date" value={newApt.date} onChange={(e) => setNewApt({ ...newApt, date: e.target.value })} className="bg-accent border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hora</Label>
                    <Input type="time" value={newApt.time} onChange={(e) => setNewApt({ ...newApt, time: e.target.value })} className="bg-accent border-border" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={newApt.type} onValueChange={(v) => setNewApt({ ...newApt, type: v as "presencial" | "telehealth" })}>
                    <SelectTrigger className="bg-accent border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="telehealth">Telehealth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Observações</Label>
                  <Textarea placeholder="Notas..." value={newApt.notes} onChange={(e) => setNewApt({ ...newApt, notes: e.target.value })} className="bg-accent border-border" />
                </div>
                <Button onClick={handleAdd} className="w-full gradient-primary font-semibold">Agendar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-accent border-border pl-9" />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {Object.entries(grouped).sort().map(([date, apts]) => (
            <div key={date}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <div className="space-y-2">
                {apts.sort((a, b) => a.time.localeCompare(b.time)).map((apt) => (
                  <div key={apt.id} className="glass-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                          {apt.patient.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{apt.patient}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {apt.time}
                            {apt.type === "presencial" ? <MapPin className="h-3 w-3 ml-1" /> : <Video className="h-3 w-3 ml-1" />}
                            {apt.type === "presencial" ? "Presencial" : "Telehealth"}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleCancel(apt.id)} className="text-xs text-destructive hover:underline">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default Agenda;
