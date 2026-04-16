import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Clock, MapPin, Video, Pencil, Trash2, UserCog, CalendarIcon, Upload, FileDown, Loader2, Lock, Unlock, Check, X, FileImage, ExternalLink, FilePlus } from "lucide-react";
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
import PageSkeleton from "@/components/PageSkeleton";
import ListPagination from "@/components/ListPagination";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import PatientSearchInput from "@/components/agenda/PatientSearchInput";
import EmptyState from "@/components/EmptyState";
import { CalendarX, Copy, Link } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { downloadCsvTemplate, AGENDA_TEMPLATE_HEADERS, AGENDA_TEMPLATE_SAMPLE } from "@/utils/csvTemplates";
import { Badge } from "@/components/ui/badge";
import { useQueryClient as useQC } from "@tanstack/react-query";
import ServiceRequestsPanel from "@/components/agenda/ServiceRequestsPanel";

const emptyForm = { patient_name: "", patient_id: "", date: "", time: "", appointment_type: "presencial", notes: "", professional_id: "" };
const blockForm = { date: "", time: "", reason: "" };

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
  const [importing, setImporting] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockData, setBlockData] = useState(blockForm);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"appointments" | "requests">("appointments");

  // Fetch service requests count for badge
  const { data: requestsCount = 0 } = useQuery({
    queryKey: ["service-requests-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("service_requests")
        .select("*", { count: "exact", head: true })
        .eq("professional_id", user!.id)
        .in("status", ["pending_review", "pending_payment"]);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const parseDateBR = (dateStr: string): string | null => {
    if (!dateStr) return null;
    const parts = dateStr.trim().split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const parsed = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      if (!isNaN(Date.parse(parsed))) return parsed;
    }
    if (!isNaN(Date.parse(dateStr.trim()))) return dateStr.trim();
    return null;
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";
    setImporting(true);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("Planilha vazia ou sem dados.");
        return;
      }

      const sep = lines[0].includes(";") ? ";" : ",";
      const rows = lines.slice(1).map((line) => line.split(sep).map((c) => c.trim().replace(/^"|"$/g, "")));

      const toInsert = rows
        .filter((cols) => cols[0] && cols[1] && cols[2])
        .map((cols) => ({
          user_id: user.id,
          patient_name: cols[0],
          date: parseDateBR(cols[1]) || cols[1],
          time: cols[2].length === 5 ? cols[2] : cols[2] + ":00",
          appointment_type: (cols[3] || "presencial").toLowerCase().includes("tele") ? "telehealth" : "presencial",
          notes: cols[4] || null,
        }));

      if (toInsert.length === 0) {
        toast.error("Nenhuma consulta válida encontrada na planilha.");
        return;
      }

      const { error } = await supabase.from("appointments").insert(toInsert);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(`${toInsert.length} consulta(s) importada(s) com sucesso!`);
    } catch {
      toast.error("Erro ao importar. Verifique o formato da planilha.");
    } finally {
      setImporting(false);
    }
  };

  const canUseTeam = hasAccess("multi_professionals");

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("professionals").select("id, name, specialty").eq("user_id", user!.id).eq("status", "active").order("name");
      return data || [];
    },
    enabled: !!user && canUseTeam,
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select("id, patient_name, patient_id, date, time, appointment_type, notes, status, professional_id, receipt_url").eq("user_id", user!.id).neq("status", "cancelled").order("date").order("time").limit(500);
      return data || [];
    },
    enabled: !!user,
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("appointments").insert({
        user_id: user!.id,
        patient_name: "🔒 Bloqueado",
        date: blockData.date,
        time: blockData.time,
        appointment_type: "blocked",
        notes: blockData.reason || "Horário bloqueado",
        status: "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setBlockData(blockForm);
      setBlockOpen(false);
      toast.success("Horário bloqueado!");
    },
    onError: () => toast.error("Erro ao bloquear horário."),
  });

  const unblockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Horário desbloqueado!");
    },
    onError: () => toast.error("Erro ao desbloquear."),
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
      toast("Você acaba de economizar R$ 0 em comissões comparado a outras plataformas. Continue crescendo com a SALBCARE! 🚀", { duration: 5000 });
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
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
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Cancel instead of delete to track cancellations
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
      // Check if suspension should be applied (3+ cancellations/month)
      await supabase.rpc("check_and_apply_suspension", { _user_id: user!.id });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      // Check if user got suspended
      const { data: profile } = await supabase.from("profiles").select("suspended_until").eq("user_id", user!.id).single();
      if (profile?.suspended_until && new Date(profile.suspended_until) > new Date()) {
        toast.warning("Atenção: seu perfil foi suspenso das buscas por 7 dias devido a 3 cancelamentos no mês.");
      } else {
        toast.success("Consulta cancelada!");
      }
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
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
    })
    .filter((a) => {
      if (filterStatus === "all") return true;
      if (filterStatus === "pending") return a.status === "aguardando_confirmacao" || a.status === "aguardando_comprovante";
      if (filterStatus === "scheduled") return a.status === "scheduled";
      return true;
    });

  const pendingCount = appointments.filter((a) => a.status === "aguardando_confirmacao" || a.status === "aguardando_comprovante").length;


  const handleBookingAction = async (appointmentId: string, action: "approve" | "reject") => {
    setProcessingId(appointmentId);
    try {
      const { error } = await supabase.functions.invoke("manage-booking", {
        body: { action, appointment_id: appointmentId },
      });
      if (error) throw error;
      toast.success(action === "approve" ? "Agendamento aprovado!" : "Agendamento recusado.");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["pending-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
    } catch (error: any) {
      toast.error(error?.message || "Erro ao processar. Tente novamente.");
    } finally {
      setProcessingId(null);
    }
  };

  const grouped = filtered.reduce<Record<string, typeof appointments>>((acc, a) => {
    (acc[a.date] = acc[a.date] || []).push(a);
    return acc;
  }, {});

  const allDateKeys = Object.keys(grouped).sort();
  const pagination = usePagination(allDateKeys);
  const paginatedGroupKeys = pagination.paginatedItems;
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
        <Label>Tipo de atendimento</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, appointment_type: "telehealth" })}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
              form.appointment_type === "telehealth"
                ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500"
                : "border-border bg-accent hover:bg-accent/80"
            )}
          >
            <span className="flex items-center gap-1.5 text-sm font-medium">🎥 Online</span>
            <span className="text-[10px] leading-tight text-muted-foreground">A consulta acontece via Google Meet. Link do seu perfil.</span>
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, appointment_type: "presencial" })}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
              form.appointment_type === "presencial"
                ? "border-green-500 bg-green-500/10 ring-1 ring-green-500"
                : "border-border bg-accent hover:bg-accent/80"
            )}
          >
            <span className="flex items-center gap-1.5 text-sm font-medium">🏥 Presencial</span>
            <span className="text-[10px] leading-tight text-muted-foreground">A consulta acontece no consultório. Nenhum link é gerado.</span>
          </button>
        </div>
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

  if (isLoading) {
    return <PageContainer><PageSkeleton variant="list" /></PageContainer>;
  }

  return (
    <PageContainer backTo="/dashboard" onRefresh={() => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); queryClient.invalidateQueries({ queryKey: ["service-requests"] }); queryClient.invalidateQueries({ queryKey: ["service-requests-count"] }); }}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Agenda</h1>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => downloadCsvTemplate("modelo-agenda.csv", AGENDA_TEMPLATE_HEADERS, AGENDA_TEMPLATE_SAMPLE)}
            >
              <FileDown className="h-3.5 w-3.5" /> Modelo
            </Button>
            <label>
              <Button size="sm" variant="outline" className="gap-1 cursor-pointer" disabled={importing} asChild>
                <span>
                  {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {importing ? "..." : "Importar"}
                </span>
              </Button>
              <input type="file" accept=".csv,.txt" onChange={handleCsvImport} className="hidden" />
            </label>
            <Dialog open={blockOpen} onOpenChange={(v) => { setBlockOpen(v); if (v) setBlockData(blockForm); }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1"><Lock className="h-3.5 w-3.5" /> Bloquear</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Bloquear Horário</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-accent border-border", !blockData.date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {blockData.date ? format(parse(blockData.date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={blockData.date ? parse(blockData.date, "yyyy-MM-dd", new Date()) : undefined}
                            onSelect={(d) => setBlockData({ ...blockData, date: d ? format(d, "yyyy-MM-dd") : "" })}
                            locale={ptBR}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Hora</Label>
                      <Select value={blockData.time} onValueChange={(v) => setBlockData({ ...blockData, time: v })}>
                        <SelectTrigger className="bg-accent border-border"><SelectValue placeholder="Horário" /></SelectTrigger>
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
                    <Label>Motivo (opcional)</Label>
                    <Input placeholder="Ex: Reunião, Almoço, Feriado..." value={blockData.reason} onChange={(e) => setBlockData({ ...blockData, reason: e.target.value })} className="bg-accent border-border" />
                  </div>
                  <Button onClick={() => blockMutation.mutate()} className="w-full" disabled={!blockData.date || !blockData.time || blockMutation.isPending}>
                    {blockMutation.isPending ? "Bloqueando..." : "Bloquear horário"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex-1 text-xs font-medium py-2 px-3 rounded-md transition-colors ${
              activeTab === "appointments" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📅 Consultas
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 text-xs font-medium py-2 px-3 rounded-md transition-colors relative ${
              activeTab === "requests" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FilePlus className="h-3.5 w-3.5 inline mr-1" />
            Solicitações
            {requestsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                {requestsCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === "requests" ? (
          <ServiceRequestsPanel />
        ) : (
        <>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-accent border-border pl-9" />
        </div>

        {/* Status Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterStatus("all")}
            className={`shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors ${filterStatus === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterStatus("scheduled")}
            className={`shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors ${filterStatus === "scheduled" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
          >
            Confirmados
          </button>
          <button
            onClick={() => setFilterStatus("pending")}
            className={`shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors relative ${filterStatus === "pending" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
          >
            Pendentes
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

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
              description="Toque em + Nova para adicionar sua primeira consulta."
            />
          )}
          {Object.keys(grouped).length === 0 && search && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma consulta encontrada</p>
          )}
          {paginatedGroupKeys.map((date) => {
            const apts = grouped[date];
            return (
              <div key={date}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                <div className="space-y-2">
                  {apts.sort((a, b) => a.time.localeCompare(b.time)).map((apt) => {
                    const isBlocked = apt.appointment_type === "blocked";
                    const profName = getProfessionalName(apt.professional_id);
                    const isTelehealth = apt.appointment_type === "telehealth";
                    const aptDateTime = new Date(`${apt.date}T${apt.time}`);
                    const minutesUntil = (aptDateTime.getTime() - Date.now()) / 60000;
                    const isStartingSoon = isTelehealth && minutesUntil > 0 && minutesUntil <= 30;
                    const isNow = isTelehealth && minutesUntil <= 0 && minutesUntil > -60;

                    if (isBlocked) {
                      return (
                        <div key={apt.id} className="glass-card p-3 opacity-60 border-dashed">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <Lock className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Bloqueado</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" /> {apt.time.substring(0, 5)}
                                  {apt.notes && apt.notes !== "Horário bloqueado" && <span>• {apt.notes}</span>}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => unblockMutation.mutate(apt.id)}
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Unlock className="h-3.5 w-3.5" /> Desbloquear
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const isPending = apt.status === "aguardando_confirmacao" || apt.status === "aguardando_comprovante";
                    const receiptUrl = apt.receipt_url
                      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/booking-receipts/${apt.receipt_url}`
                      : null;

                    return (
                      <div key={apt.id} className={cn("glass-card p-3 space-y-2", isPending && "ring-1 ring-orange-500/20")}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                              {apt.patient_name.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-medium">{apt.patient_name}</p>
                                {isTelehealth ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                                    🎥 Online
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400">
                                    🏥 Presencial
                                  </span>
                                )}
                                {isPending && (
                                  <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-600 px-1.5 py-0">
                                    <Clock className="h-3 w-3 mr-0.5" /> {apt.status === "aguardando_comprovante" ? "Aguardando comprovante" : "Pendente"}
                                  </Badge>
                                )}
                                {isStartingSoon && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400 animate-pulse">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Em breve
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" /> {apt.time.substring(0, 5)}
                              </div>
                              {profName && (
                                <div className="flex items-center gap-1 text-[10px] text-primary mt-0.5">
                                  <UserCog className="h-2.5 w-2.5" />
                                  {profName}
                                </div>
                              )}
                            </div>
                          </div>
                          {!isPending && (
                            <div className="flex items-center gap-2">
                              {isNow && (
                                <a href="/telehealth" className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white animate-pulse hover:bg-green-700 transition-colors">
                                  Entrar agora
                                </a>
                              )}
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
                          )}
                        </div>

                        {/* Pending booking actions */}
                        {apt.status === "aguardando_confirmacao" && (
                          <>
                            {receiptUrl && (
                              <a
                                href={receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border border-border bg-accent/50 px-3 py-2 text-xs text-primary hover:bg-accent transition-colors"
                              >
                                <FileImage className="h-4 w-4" />
                                Ver comprovante
                                <ExternalLink className="h-3 w-3 ml-auto" />
                              </a>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 gap-1 bg-success hover:bg-success/90 text-white"
                                disabled={processingId === apt.id}
                                onClick={() => handleBookingAction(apt.id, "approve")}
                              >
                                <Check className="h-3.5 w-3.5" />
                                {processingId === apt.id ? "..." : "Aprovar"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                                disabled={processingId === apt.id}
                                onClick={() => handleBookingAction(apt.id, "reject")}
                              >
                                <X className="h-3.5 w-3.5" />
                                Recusar
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <ListPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onNext={pagination.nextPage}
            onPrev={pagination.prevPage}
          />
        </motion.div>
        </>
        )}
      </div>
    </PageContainer>
  );
};

export default Agenda;
