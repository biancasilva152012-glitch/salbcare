import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Clock, MapPin, Video, Pencil, Trash2, UserCog, CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import PatientSearchInput from "@/components/agenda/PatientSearchInput";
import EmptyState from "@/components/EmptyState";
import { CalendarX, Copy, Link } from "lucide-react";

const emptyForm = { patient_name: "", patient_id: "", date: "", time: "", appointment_type: "presencial", notes: "", professional_id: "" };

const Agenda = () => {
  const { user } = useAuth();
  const { hasAccess } = useFeatureGate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterProfessional, setFilterProfessional] = useState<string>("all");

  const canUseTeam = hasAccess("multi_professionals");

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("professionals").select("*").eq("user_id", user!.id).eq("status", "active").order("name");
      return data || [];
    },
    enabled: !!user && canUseTeam,
  });

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
        patient_name: form.patient_name,
        patient_id: form.patient_id || null,
        date: form.date,
        time: form.time,
        appointment_type: form.appointment_type,
        notes: form.notes || null,
        professional_id: form.professional_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setForm(emptyForm);
      setOpen(false);
      toast.success("Consulta agendada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("appointments").update({
        patient_name: form.patient_name,
        patient_id: form.patient_id || null,
        date: form.date,
        time: form.time,
        appointment_type: form.appointment_type,
        notes: form.notes || null,
        professional_id: form.professional_id || null,
      }).eq("id", editId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setForm(emptyForm);
      setEditOpen(false);
      setEditId(null);
      toast.success("Consulta atualizada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Consulta excluída!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (apt: typeof appointments[0]) => {
    setEditId(apt.id);
    setForm({
      patient_name: apt.patient_name,
      patient_id: apt.patient_id || "",
      date: apt.date,
      time: apt.time,
      appointment_type: apt.appointment_type,
      notes: apt.notes || "",
      professional_id: apt.professional_id || "",
    });
    setEditOpen(true);
  };

  const getProfessionalName = (profId: string | null) => {
    if (!profId) return null;
    return professionals.find((p) => p.id === profId)?.name || null;
  };

  const filtered = appointments
    .filter((a) => a.patient_name.toLowerCase().includes(search.toLowerCase()))
    .filter((a) => {
      if (!canUseTeam || filterProfessional === "all") return true;
      if (filterProfessional === "unassigned") return !a.professional_id;
      return a.professional_id === filterProfessional;
    });

  const grouped = filtered.reduce<Record<string, typeof appointments>>((acc, a) => {
    (acc[a.date] = acc[a.date] || []).push(a);
    return acc;
  }, {});

  const renderAppointmentForm = (isEdit: boolean) => (
    <div className="space-y-3 pt-2">
      <div className="space-y-1.5">
        <Label>Paciente</Label>
        <PatientSearchInput
          value={form.patient_name}
          patientId={form.patient_id}
          onChange={(name, id) => setForm({ ...form, patient_name: name, patient_id: id })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-accent border-border",
                  !form.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.date
                  ? format(parse(form.date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")
                  : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.date ? parse(form.date, "yyyy-MM-dd", new Date()) : undefined}
                onSelect={(d) => setForm({ ...form, date: d ? format(d, "yyyy-MM-dd") : "" })}
                locale={ptBR}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label>Hora</Label>
          <Select value={form.time} onValueChange={(v) => setForm({ ...form, time: v })}>
            <SelectTrigger className="bg-accent border-border">
              <SelectValue placeholder="Horário" />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {Array.from({ length: 28 }, (_, i) => {
                const h = Math.floor(i / 2) + 7;
                const m = i % 2 === 0 ? "00" : "30";
                const val = `${String(h).padStart(2, "0")}:${m}`;
                return <SelectItem key={val} value={val}>{val}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <Select value={form.appointment_type} onValueChange={(v) => setForm({ ...form, appointment_type: v })}>
          <SelectTrigger className="bg-accent border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="presencial">Presencial</SelectItem>
            <SelectItem value="telehealth">Telehealth</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {canUseTeam && professionals.length > 0 && (
        <div className="space-y-1.5">
          <Label>Profissional</Label>
          <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v === "none" ? "" : v })}>
            <SelectTrigger className="bg-accent border-border"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem profissional</SelectItem>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name} — {p.specialty}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5"><Label>Observações</Label><Textarea placeholder="Notas..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-accent border-border" /></div>
      <Button onClick={() => isEdit ? updateMutation.mutate() : addMutation.mutate()} className="w-full gradient-primary font-semibold" disabled={addMutation.isPending || updateMutation.isPending}>
        {isEdit ? (updateMutation.isPending ? "Salvando..." : "Salvar") : (addMutation.isPending ? "Agendando..." : "Agendar")}
      </Button>
    </div>
  );

  return (
    <PageContainer>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Agenda</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setForm(emptyForm); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary gap-1"><Plus className="h-4 w-4" /> Nova</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Nova Consulta</DialogTitle></DialogHeader>
              {renderAppointmentForm(false)}
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-accent border-border pl-9" />
        </div>

        {/* Professional Filter - only for Clinic plan */}
        {canUseTeam && professionals.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFilterProfessional("all")}
              className={`shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors ${filterProfessional === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterProfessional("unassigned")}
              className={`shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors ${filterProfessional === "unassigned" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              Sem profissional
            </button>
            {professionals.map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterProfessional(p.id)}
                className={`shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors ${filterProfessional === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >
                {p.name.split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Editar Consulta</DialogTitle></DialogHeader>
            {renderAppointmentForm(true)}
          </DialogContent>
        </Dialog>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {Object.keys(grouped).length === 0 && !search && (
            <EmptyState
              icon={CalendarX}
              title="Nenhuma consulta agendada"
              description="Você ainda não tem consultas agendadas. Compartilhe seu link de agendamento com seus pacientes:"
              extra={
                <div className="flex items-center gap-2 bg-accent rounded-lg px-3 py-2 w-full max-w-xs">
                  <Link className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate flex-1">salbcare.lovable.app/booking/{user?.id?.slice(0, 8)}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://salbcare.lovable.app/booking/${user?.id?.slice(0, 8)}`);
                      toast.success("Link copiado!");
                    }}
                    className="text-primary hover:text-primary/80"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              }
            />
          )}
          {Object.keys(grouped).length === 0 && search && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma consulta encontrada</p>
          )}
          {Object.entries(grouped).sort().map(([date, apts]) => (
            <div key={date}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <div className="space-y-2">
                {apts.sort((a, b) => a.time.localeCompare(b.time)).map((apt) => {
                  const profName = getProfessionalName(apt.professional_id);
                  return (
                    <div key={apt.id} className="glass-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                            {apt.patient_name.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{apt.patient_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {apt.time.substring(0, 5)}
                              {apt.appointment_type === "presencial" ? <MapPin className="h-3 w-3 ml-1" /> : <Video className="h-3 w-3 ml-1" />}
                              {apt.appointment_type === "presencial" ? "Presencial" : "Telehealth"}
                            </div>
                            {profName && (
                              <div className="flex items-center gap-1 text-[10px] text-primary mt-0.5">
                                <UserCog className="h-2.5 w-2.5" />
                                {profName}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(apt)} className="text-xs text-primary hover:underline"><Pencil className="h-3.5 w-3.5" /></button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-xs text-destructive hover:underline"><Trash2 className="h-3.5 w-3.5" /></button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir consulta?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(apt.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default Agenda;
