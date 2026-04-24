import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Calendar, Video, Plus, Trash2, ArrowRight, Sparkles, Lock, X, CheckCircle2, Clock, Phone, RotateCcw, AlertCircle, Search, Pencil, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { trackCtaClick } from "@/hooks/useTracking";
import {
  DEMO_LIMITS,
  DEMO_STORAGE as DEMO_STORAGE_KEYS,
  incrementUsageCounter,
  readUsageCounters,
  getAllModuleUsage,
} from "@/lib/demoStorage";

// ============= Types =============
type DemoPatient = { id: string; name: string; phone: string; notes?: string };
type DemoAppointment = { id: string; patient: string; date: string; time: string; type: "presencial" | "online" };
type DemoTab = "pacientes" | "agenda" | "telehealth";
type PatientFilter = "all" | "with-phone" | "no-phone";
type AppointmentFilter = "all" | "presencial" | "online" | "today" | "upcoming";

// ============= Demo limits (re-export aliases for legacy local refs) =============
const STORAGE = DEMO_STORAGE_KEYS;

// ============= Seeds (consistent: appointments reference real patients & coherent dates) =============
const isoDateOffset = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const buildSeedPatients = (): DemoPatient[] => [
  { id: "demo-1", name: "Maria Silva", phone: "(11) 98888-1234", notes: "Acompanhamento mensal" },
  { id: "demo-2", name: "João Santos", phone: "(11) 97777-5678", notes: "Primeira consulta" },
];

const buildSeedAppointments = (): DemoAppointment[] => [
  { id: "ap-1", patient: "Maria Silva", date: isoDateOffset(0), time: "14:00", type: "presencial" },
  { id: "ap-2", patient: "João Santos", date: isoDateOffset(1), time: "10:30", type: "online" },
];

const seedPatients = buildSeedPatients();
const seedAppointments = buildSeedAppointments();

// ============= Hooks =============
function useLocalState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {/* ignore */}
  }, [key, value]);
  return [value, setValue];
}

// ============= Page =============
const Experimente = () => {
  const navigate = useNavigate();
  const [tab, setTabRaw] = useState<DemoTab>(() => {
    if (typeof window === "undefined") return "pacientes";
    const saved = window.localStorage.getItem(STORAGE.activeTab) as DemoTab | null;
    return saved === "pacientes" || saved === "agenda" || saved === "telehealth" ? saved : "pacientes";
  });
  const setTab = (t: DemoTab) => {
    setTabRaw(t);
    try { window.localStorage.setItem(STORAGE.activeTab, t); } catch {/* ignore */}
    if (t === "telehealth") {
      setUsage(incrementUsageCounter("telehealthViews"));
    }
  };
  const [patients, setPatients] = useLocalState<DemoPatient[]>(STORAGE.patients, seedPatients);
  const [appointments, setAppointments] = useLocalState<DemoAppointment[]>(STORAGE.appointments, seedAppointments);

  // Persisted filters / search
  const [patientsSearch, setPatientsSearch] = useLocalState<string>(STORAGE.patientsSearch, "");
  const [patientsFilter, setPatientsFilter] = useLocalState<PatientFilter>(STORAGE.patientsFilter, "all");
  const [apptsSearch, setApptsSearch] = useLocalState<string>(STORAGE.appointmentsSearch, "");
  const [apptsFilter, setApptsFilter] = useLocalState<AppointmentFilter>(STORAGE.appointmentsFilter, "all");

  const [signupOpen, setSignupOpen] = useState(false);
  const [signupReason, setSignupReason] = useState<string>("");
  const [usage, setUsage] = useState(() => readUsageCounters());

  // Forms
  const [newPatient, setNewPatient] = useState({ name: "", phone: "", notes: "" });
  const [newAppt, setNewAppt] = useState({ patient: "", date: "", time: "", type: "presencial" as const });
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showApptForm, setShowApptForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editingApptId, setEditingApptId] = useState<string | null>(null);

  // Track first visit
  useEffect(() => {
    if (!localStorage.getItem(STORAGE.visited)) {
      localStorage.setItem(STORAGE.visited, "1");
      trackCtaClick("demo_started", "experimente_page");
    }
  }, []);

  const askSignup = (reason: string) => {
    setSignupReason(reason);
    setSignupOpen(true);
    trackCtaClick("demo_signup_prompt", reason);
  };

  const resetDemoData = () => {
    if (!confirm("Apagar todos os dados da demo e voltar ao estado inicial?")) return;
    // Re-seed with fresh, consistent data (today/tomorrow dates + matching patients)
    const freshPatients = buildSeedPatients();
    const freshAppointments = buildSeedAppointments();
    setPatients(freshPatients);
    setAppointments(freshAppointments);
    setShowPatientForm(false);
    setShowApptForm(false);
    setEditingPatientId(null);
    setEditingApptId(null);
    setNewPatient({ name: "", phone: "", notes: "" });
    setNewAppt({ patient: "", date: "", time: "", type: "presencial" });
    setPatientsSearch("");
    setPatientsFilter("all");
    setApptsSearch("");
    setApptsFilter("all");
    toast.success("Dados re-semeados com pacientes e consultas iniciais");
    trackCtaClick("demo_reset", "experimente_page");
  };

  // Patient handlers
  const startNewPatient = () => {
    if (patients.length >= DEMO_LIMITS.patients) return; // blocked, alert handles UX
    setEditingPatientId(null);
    setNewPatient({ name: "", phone: "", notes: "" });
    setShowPatientForm((v) => !v);
  };

  const startEditPatient = (p: DemoPatient) => {
    setEditingPatientId(p.id);
    setNewPatient({ name: p.name, phone: p.phone, notes: p.notes ?? "" });
    setShowPatientForm(true);
  };

  const savePatient = () => {
    if (!newPatient.name.trim()) { toast.error("Informe o nome"); return; }
    if (editingPatientId) {
      setPatients(patients.map((p) => (p.id === editingPatientId ? { ...p, ...newPatient } : p)));
      toast.success("Paciente atualizado (demo)");
    } else {
      if (patients.length >= DEMO_LIMITS.patients) {
        askSignup(`Você atingiu ${DEMO_LIMITS.patients} pacientes na demo`);
        return;
      }
      setPatients([{ id: crypto.randomUUID(), ...newPatient }, ...patients]);
      setUsage(incrementUsageCounter("patientsCreated"));
      toast.success("Paciente adicionado (demo)");
    }
    setNewPatient({ name: "", phone: "", notes: "" });
    setEditingPatientId(null);
    setShowPatientForm(false);
  };

  const removePatient = (id: string) => {
    setPatients(patients.filter((p) => p.id !== id));
  };

  // Appointment handlers
  const startNewAppt = () => {
    if (appointments.length >= DEMO_LIMITS.appointments) return;
    setEditingApptId(null);
    setNewAppt({ patient: "", date: "", time: "", type: "presencial" });
    setShowApptForm((v) => !v);
  };

  const startEditAppt = (a: DemoAppointment) => {
    setEditingApptId(a.id);
    setNewAppt({ patient: a.patient, date: a.date, time: a.time, type: a.type as "presencial" });
    setShowApptForm(true);
  };

  const saveAppointment = () => {
    if (!newAppt.patient || !newAppt.date || !newAppt.time) { toast.error("Preencha todos os campos"); return; }
    if (editingApptId) {
      setAppointments(appointments.map((a) => (a.id === editingApptId ? { ...a, ...newAppt } : a)));
      toast.success("Consulta atualizada (demo)");
    } else {
      if (appointments.length >= DEMO_LIMITS.appointments) {
        askSignup(`Você criou ${DEMO_LIMITS.appointments} consultas na demo`);
        return;
      }
      setAppointments([{ id: crypto.randomUUID(), ...newAppt }, ...appointments]);
      setUsage(incrementUsageCounter("appointmentsCreated"));
      toast.success("Consulta agendada (demo)");
    }
    setNewAppt({ patient: "", date: "", time: "", type: "presencial" });
    setEditingApptId(null);
    setShowApptForm(false);
  };

  const cancelAppointment = (id: string) => {
    setAppointments(appointments.filter((a) => a.id !== id));
    toast.success("Consulta cancelada");
  };

  // Derived: filtered lists
  const filteredPatients = useMemo(() => {
    const q = patientsSearch.trim().toLowerCase();
    return patients.filter((p) => {
      if (patientsFilter === "with-phone" && !p.phone) return false;
      if (patientsFilter === "no-phone" && !!p.phone) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.notes ?? "").toLowerCase().includes(q)
      );
    });
  }, [patients, patientsSearch, patientsFilter]);

  const filteredAppointments = useMemo(() => {
    const q = apptsSearch.trim().toLowerCase();
    const today = isoDateOffset(0);
    return appointments.filter((a) => {
      if (apptsFilter === "presencial" && a.type !== "presencial") return false;
      if (apptsFilter === "online" && a.type !== "online") return false;
      if (apptsFilter === "today" && a.date !== today) return false;
      if (apptsFilter === "upcoming" && a.date < today) return false;
      if (!q) return true;
      return a.patient.toLowerCase().includes(q) || a.date.includes(q) || a.time.includes(q);
    });
  }, [appointments, apptsSearch, apptsFilter]);

  const goToSignup = () => {
    trackCtaClick("demo_to_pro_landing", signupReason || "header_cta");
    // Leva para a landing profissional para conhecer planos antes de cadastrar
    navigate("/para-profissionais");
  };

  return (
    <>
      <SEOHead
        title="Experimente sem cadastro | SalbCare"
        description="Teste a Agenda, Pacientes e Teleconsulta da SalbCare gratuitamente, sem criar conta. Veja como funciona em 2 minutos."
        canonical="/experimente"
      />
      <div className="min-h-screen bg-background font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Demo banner */}
        <div className="sticky top-0 z-30 bg-primary/10 backdrop-blur-md border-b border-primary/20">
          <div className="mx-auto max-w-2xl px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">Modo demonstração</span>
              <span className="text-muted-foreground hidden sm:inline">— seus dados ficam só no seu navegador</span>
            </div>
            <Button size="sm" onClick={goToSignup} className="gradient-primary text-xs h-8">
              Ver planos
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Hero */}
        <div className="mx-auto max-w-2xl px-4 pt-6 pb-4 text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold">Veja como é fácil organizar sua rotina</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre pacientes, marque consultas e teste a teleconsulta. Quando gostar, ative sua conta em 20 segundos.
          </p>
        </div>

        {/* Usage meter — quanto resta antes do bloqueio em cada módulo */}
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <div className="glass-card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              {
                label: "Pacientes",
                used: patients.length,
                limit: DEMO_LIMITS.patients,
                icon: Users,
              },
              {
                label: "Consultas",
                used: appointments.length,
                limit: DEMO_LIMITS.appointments,
                icon: Calendar,
              },
              {
                label: "Telehealth views",
                used: usage.telehealthViews,
                limit: DEMO_LIMITS.telehealthViews,
                icon: Video,
              },
              {
                label: "Teleconsultas",
                used: usage.telehealthAttempts,
                limit: DEMO_LIMITS.telehealthAttempts,
                icon: Lock,
              },
            ].map((m) => {
              const Icon = m.icon;
              const remaining = Math.max(0, m.limit - m.used);
              const blocked = remaining === 0;
              return (
                <div key={m.label} className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                    <Icon className="h-3 w-3" />
                    <span className="truncate">{m.label}</span>
                  </div>
                  <p className={`text-sm font-bold ${blocked ? "text-destructive" : "text-foreground"}`}>
                    {m.used}/{m.limit}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {blocked ? "bloqueado" : `${remaining} restante${remaining === 1 ? "" : "s"}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/50 p-1 border border-border/40">
            {[
              { id: "pacientes", label: "Pacientes", icon: Users },
              { id: "agenda", label: "Agenda", icon: Calendar },
              { id: "telehealth", label: "Teleconsulta", icon: Video },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as any)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    active ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-2xl px-4 py-5 space-y-4 pb-32">
          <AnimatePresence mode="wait">
            {/* Pacientes */}
            {tab === "pacientes" && (
              <motion.div
                key="pacientes"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium">
                          {patients.length}/{DEMO_LIMITS.patients} pacientes na demo
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {Math.max(0, DEMO_LIMITS.patients - patients.length)} restantes
                        </span>
                      </div>
                      <Progress value={(patients.length / DEMO_LIMITS.patients) * 100} className="h-1.5" />
                    </div>
                    <Button size="sm" variant="outline" onClick={startNewPatient} disabled={patients.length >= DEMO_LIMITS.patients && !editingPatientId}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  {patients.length === DEMO_LIMITS.patients - 1 && (
                    <Alert className="py-2 border-amber-500/40 bg-amber-500/5">
                      <AlertCircle className="h-3.5 w-3.5 !text-amber-600" />
                      <AlertDescription className="text-xs ml-1">
                        Falta só 1 vaga. Próximo paciente vai sugerir conhecer os planos.
                      </AlertDescription>
                    </Alert>
                  )}
                  {patients.length >= DEMO_LIMITS.patients && (
                    <Alert className="py-2 border-primary/40 bg-primary/5">
                      <Lock className="h-3.5 w-3.5 !text-primary" />
                      <AlertDescription className="text-xs ml-1">
                        <strong>Criar bloqueado.</strong> Editar e remover continuam liberados — crie conta para pacientes ilimitados.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Search + filter (persisted) */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={patientsSearch}
                      onChange={(e) => setPatientsSearch(e.target.value)}
                      placeholder="Buscar pacientes…"
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                  <Select value={patientsFilter} onValueChange={(v) => setPatientsFilter(v as PatientFilter)}>
                    <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="with-phone">Com telefone</SelectItem>
                      <SelectItem value="no-phone">Sem telefone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showPatientForm && (
                  <div className="glass-card p-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {editingPatientId ? "Editando paciente" : "Novo paciente"}
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nome *</Label>
                      <Input value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} placeholder="Ex: Ana Costa" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Telefone</Label>
                      <Input value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} placeholder="(11) 99999-0000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Observações</Label>
                      <Input value={newPatient.notes} onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })} placeholder="Opcional" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={savePatient} className="flex-1 gradient-primary">
                        {editingPatientId ? "Atualizar" : "Salvar"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setShowPatientForm(false); setEditingPatientId(null); }}>Cancelar</Button>
                    </div>
                  </div>
                )}

                {filteredPatients.length === 0 && (
                  <div className="glass-card p-8 text-center text-sm text-muted-foreground">
                    {patients.length === 0 ? "Nenhum paciente cadastrado." : "Nenhum resultado para a busca/filtro."}
                  </div>
                )}

                {filteredPatients.map((p) => (
                  <div key={p.id} className="glass-card p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.phone || "Sem telefone"}</p>
                    </div>
                    <button
                      onClick={() => startEditPatient(p)}
                      className="text-muted-foreground hover:text-primary p-1.5"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removePatient(p.id)}
                      className="text-muted-foreground hover:text-destructive p-1.5"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {patients.length >= DEMO_LIMITS.patients && (
                  <button
                    onClick={() => askSignup("Limite de pacientes da demo atingido")}
                    className="w-full glass-card p-4 border-dashed border-primary/40 flex items-center justify-center gap-2 text-sm text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Lock className="h-4 w-4" />
                    Limite da demo — crie conta para pacientes ilimitados
                  </button>
                )}
              </motion.div>
            )}


            {/* Agenda */}
            {tab === "agenda" && (
              <motion.div
                key="agenda"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium">
                          {appointments.length}/{DEMO_LIMITS.appointments} consultas na demo
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {Math.max(0, DEMO_LIMITS.appointments - appointments.length)} restantes
                        </span>
                      </div>
                      <Progress value={(appointments.length / DEMO_LIMITS.appointments) * 100} className="h-1.5" />
                    </div>
                    <Button size="sm" variant="outline" onClick={startNewAppt} disabled={appointments.length >= DEMO_LIMITS.appointments && !editingApptId}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Nova consulta
                    </Button>
                  </div>
                  {appointments.length === DEMO_LIMITS.appointments - 1 && (
                    <Alert className="py-2 border-amber-500/40 bg-amber-500/5">
                      <AlertCircle className="h-3.5 w-3.5 !text-amber-600" />
                      <AlertDescription className="text-xs ml-1">
                        Falta só 1 vaga. Próxima consulta vai sugerir conhecer os planos.
                      </AlertDescription>
                    </Alert>
                  )}
                  {appointments.length >= DEMO_LIMITS.appointments && (
                    <Alert className="py-2 border-primary/40 bg-primary/5">
                      <Lock className="h-3.5 w-3.5 !text-primary" />
                      <AlertDescription className="text-xs ml-1">
                        <strong>Criar nova consulta bloqueado.</strong> Editar e cancelar continuam liberados — crie conta para agenda ilimitada.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Search + filter (persisted) */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={apptsSearch}
                      onChange={(e) => setApptsSearch(e.target.value)}
                      placeholder="Buscar consultas…"
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                  <Select value={apptsFilter} onValueChange={(v) => setApptsFilter(v as AppointmentFilter)}>
                    <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="upcoming">Próximas</SelectItem>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showApptForm && (
                  <div className="glass-card p-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {editingApptId ? "Editando consulta" : "Nova consulta"}
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Paciente *</Label>
                      <Input value={newAppt.patient} onChange={(e) => setNewAppt({ ...newAppt, patient: e.target.value })} placeholder="Nome do paciente" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Data *</Label>
                        <Input type="date" value={newAppt.date} onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Hora *</Label>
                        <Input type="time" value={newAppt.time} onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveAppointment} className="flex-1 gradient-primary">
                        {editingApptId ? "Atualizar" : "Agendar"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setShowApptForm(false); setEditingApptId(null); }}>Cancelar</Button>
                    </div>
                  </div>
                )}

                {filteredAppointments.length === 0 && (
                  <div className="glass-card p-8 text-center text-sm text-muted-foreground">
                    {appointments.length === 0 ? "Nenhuma consulta agendada." : "Nenhum resultado para a busca/filtro."}
                  </div>
                )}

                {filteredAppointments.map((a) => (
                  <div key={a.id} className="glass-card p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      {a.type === "online" ? <Video className="h-4 w-4 text-primary" /> : <Calendar className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{a.patient}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(a.date + "T00:00").toLocaleDateString("pt-BR")} às {a.time}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-1">{a.type}</span>
                    <button
                      onClick={() => startEditAppt(a)}
                      className="text-muted-foreground hover:text-primary p-1.5"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => cancelAppointment(a.id)}
                      className="text-muted-foreground hover:text-destructive p-1.5"
                      aria-label="Cancelar consulta"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {appointments.length >= DEMO_LIMITS.appointments && (
                  <button
                    onClick={() => askSignup("Limite de consultas da demo atingido")}
                    className="w-full glass-card p-4 border-dashed border-primary/40 flex items-center justify-center gap-2 text-sm text-primary"
                  >
                    <Lock className="h-4 w-4" />
                    Limite da demo — crie conta para agenda ilimitada
                  </button>
                )}

              </motion.div>
            )}

            {/* Telehealth */}
            {tab === "telehealth" && (
              <motion.div
                key="telehealth"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                {/* Per-module counters */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <p className="font-medium">
                      {usage.telehealthViews}/{DEMO_LIMITS.telehealthViews} visualizações
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.max(0, DEMO_LIMITS.telehealthViews - usage.telehealthViews)} restantes
                    </span>
                  </div>
                  <Progress
                    value={(usage.telehealthViews / DEMO_LIMITS.telehealthViews) * 100}
                    className="h-1.5"
                  />
                  <div className="flex items-center justify-between gap-2 text-xs pt-1">
                    <p className="font-medium">
                      {usage.telehealthAttempts}/{DEMO_LIMITS.telehealthAttempts} teleconsultas (demo)
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.max(0, DEMO_LIMITS.telehealthAttempts - usage.telehealthAttempts)} restantes
                    </span>
                  </div>
                  <Progress
                    value={(usage.telehealthAttempts / DEMO_LIMITS.telehealthAttempts) * 100}
                    className="h-1.5"
                  />
                  {usage.telehealthAttempts >= DEMO_LIMITS.telehealthAttempts && (
                    <Alert className="py-2 border-primary/40 bg-primary/5">
                      <Lock className="h-3.5 w-3.5 !text-primary" />
                      <AlertDescription className="text-xs ml-1">
                        <strong>Criar nova teleconsulta bloqueado.</strong> Visualizar este módulo continua liberado — crie conta para teleconsultas ilimitadas.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="glass-card p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">Teleconsulta via Google Meet</h3>
                      <p className="text-xs text-muted-foreground">Atenda online com link fixo no seu perfil</p>
                    </div>
                  </div>

                  <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 via-primary/5 to-background border border-border/40 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 backdrop-blur-sm bg-background/40 flex flex-col items-center justify-center gap-3 z-10">
                      <Lock className="h-8 w-8 text-primary" />
                      <p className="text-sm font-semibold">Recurso exclusivo da conta real</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          // Increment the "tried to create teleconsulta" counter
                          // and trigger the contextual paywall — only this
                          // specific premium action is blocked.
                          setUsage(incrementUsageCounter("telehealthAttempts"));
                          askSignup("Criar teleconsulta requer cadastro");
                        }}
                        className="gradient-primary"
                      >
                        Tentar criar teleconsulta
                      </Button>
                    </div>
                    <div className="text-center text-xs text-muted-foreground">
                      <Video className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      Sala de teleconsulta
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm">
                    {[
                      "Link fixo do Google Meet salvo no seu perfil",
                      "Compartilhe com o paciente por WhatsApp em 1 clique",
                      "Anote o atendimento direto no prontuário",
                      "Sem instalação, sem mensalidade extra",
                    ].map((b) => (
                      <li key={b} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card p-4 flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold">Quer ver funcionando agora?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Crie conta grátis e configure seu link em menos de 1 minuto.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset demo data */}
          <div className="pt-2 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetDemoData}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Limpar meus dados da demo
            </Button>
          </div>
        </div>


        {/* Sticky bottom CTA */}
        <div className="fixed bottom-0 inset-x-0 z-30 bg-background/90 backdrop-blur-md border-t border-border/40 p-3">
          <div className="mx-auto max-w-2xl flex items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-semibold">Gostou? Salve seus dados de verdade.</p>
              <p className="text-muted-foreground">Migre tudo da demo em 1 clique.</p>
            </div>
            <Button onClick={goToSignup} className="gradient-primary shrink-0">
              Ativar conta
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Signup prompt modal */}
      <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 px-6 pt-8 pb-6 text-center relative">
            <button onClick={() => setSignupOpen(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Continue com sua conta</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {signupReason || "Crie conta grátis para destravar o resto da plataforma."}
            </p>
          </div>
          <div className="px-6 py-4 space-y-2.5">
            {[
              "Pacientes ilimitados (no Essencial)",
              "Agenda completa com lembretes",
              "Teleconsulta via Google Meet",
              "Prontuário e financeiro integrados",
            ].map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
          <div className="px-6 pb-6 space-y-2">
            <Button onClick={goToSignup} className="w-full gradient-primary font-bold py-5">
              Criar conta em 20 segundos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSignupOpen(false)} className="w-full text-muted-foreground">
              Continuar explorando
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Experimente;
