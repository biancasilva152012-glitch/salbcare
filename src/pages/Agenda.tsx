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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Agenda = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newApt, setNewApt] = useState({ patient_name: "", date: "", time: "", appointment_type: "presencial", notes: "" });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select("*").eq("user_id", user!.id).neq("status", "cancelled").order("date").order("time");
      return data || [];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("appointments").insert({
        user_id: user!.id,
        patient_name: newApt.patient_name,
        date: newApt.date,
        time: newApt.time,
        appointment_type: newApt.appointment_type,
        notes: newApt.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setNewApt({ patient_name: "", date: "", time: "", appointment_type: "presencial", notes: "" });
      setOpen(false);
      toast.success("Consulta agendada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Consulta cancelada");
    },
  });

  const filtered = appointments.filter((a) => a.patient_name.toLowerCase().includes(search.toLowerCase()));

  const grouped = filtered.reduce<Record<string, typeof appointments>>((acc, a) => {
    (acc[a.date] = acc[a.date] || []).push(a);
    return acc;
  }, {});

  return (
    <PageContainer>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Agenda</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary gap-1"><Plus className="h-4 w-4" /> Nova</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Nova Consulta</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label>Paciente</Label>
                  <Input placeholder="Nome do paciente" value={newApt.patient_name} onChange={(e) => setNewApt({ ...newApt, patient_name: e.target.value })} className="bg-accent border-border" />
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
                  <Select value={newApt.appointment_type} onValueChange={(v) => setNewApt({ ...newApt, appointment_type: v })}>
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
                <Button onClick={() => addMutation.mutate()} className="w-full gradient-primary font-semibold" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Agendando..." : "Agendar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-accent border-border pl-9" />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {Object.keys(grouped).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma consulta encontrada</p>
          )}
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
                          {apt.patient_name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{apt.patient_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {apt.time}
                            {apt.appointment_type === "presencial" ? <MapPin className="h-3 w-3 ml-1" /> : <Video className="h-3 w-3 ml-1" />}
                            {apt.appointment_type === "presencial" ? "Presencial" : "Telehealth"}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => cancelMutation.mutate(apt.id)} className="text-xs text-destructive hover:underline">
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
