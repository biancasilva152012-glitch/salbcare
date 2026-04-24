import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Calendar, Video, Plus, Trash2, ArrowRight, Sparkles, Lock, X, CheckCircle2, Clock, Phone, RotateCcw, AlertCircle, Search, Pencil, Ban, Download, FileText, FileSpreadsheet,
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
  syncDemoCounters,
  pushCounterToBackend,
  exportDemoAsCsv,
  exportDemoAsPdf,
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

  // Unified usage source for all modules — keeps top meter, per-module
  // counters and Progress bars perfectly in sync. Recomputed whenever the
  // underlying lists or counters change.
  const moduleUsage = useMemo(
    () => getAllModuleUsage(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patients.length, appointments.length, usage],
  );

  // Best-effort backend push whenever counters change locally. Keeps the
  // demo_usage_counters table in sync so the limit can't be reset by clearing
  // localStorage. Failures are silent.
  useEffect(() => {
    pushCounterToBackend(null, usage).catch(() => {});
  }, [usage]);
  // Forms
  const [newPatient, setNewPatient] = useState({ name: "", phone: "", notes: "" });
  const [newAppt, setNewAppt] = useState({ patient: "", date: "", time: "", type: "presencial" as const });
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showApptForm, setShowApptForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editingApptId, setEditingApptId] = useState<string | null>(null);

  // Track first visit + reconcile counters with backend on mount
  useEffect(() => {
    if (!localStorage.getItem(STORAGE.visited)) {
      localStorage.setItem(STORAGE.visited, "1");
      trackCtaClick("demo_started", "experimente_page");
    }
    // Pull the latest counters from the backend (guest row) and reconcile
    // with localStorage. Prevents abuse via cache clearing and keeps usage
    // consistent across devices that share the same guest_id (rare) or
    // when the user later logs in and counters are merged.
    syncDemoCounters(null).then((merged) => setUsage(merged)).catch(() => {});
  }, []);

  // Runtime consistency check: surface mismatches between UI and backend
  useFreemiumConsistencyCheck(null);

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

        {/* Usage meter — quanto resta antes do bloqueio em cada módulo.
            Apenas a ação premium (criar) bloqueia; navegação fica sempre liberada. */}
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <div className="glass-card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              { ...moduleUsage.patients, icon: Users, label: "Pacientes", isPremium: true },
              { ...moduleUsage.appointments, icon: Calendar, label: "Consultas", isPremium: true },
              {
                used: moduleUsage.telehealth.views?.used ?? 0,
                limit: moduleUsage.telehealth.views?.limit ?? 0,
                remaining: moduleUsage.telehealth.views?.remaining ?? 0,
                blocked: false, // views never block navigation
                icon: Video,
                label: "Telehealth views",
                isPremium: false,
              },
              {
                used: moduleUsage.telehealth.used,
                limit: moduleUsage.telehealth.limit,
                remaining: moduleUsage.telehealth.remaining,
                blocked: moduleUsage.telehealth.blocked,
                icon: Lock,
                label: "Teleconsultas",
                isPremium: true,
              },
            ].map((m) => {
              const Icon = m.icon;
              const blocked = m.blocked;
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
                    {blocked
                      ? m.isPremium
                        ? "criar bloqueado"
                        : "limite informativo"
                      : `${m.remaining} restante${m.remaining === 1 ? "" : "s"}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export bar — leve seus dados antes de virar assinante */}
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <div className="glass-card p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-1">
              <Download className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                Baixe seus dados da demo (pacientes, agenda e teleconsultas) antes de virar assinante.
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8"
                onClick={() => {
                  exportDemoAsCsv();
                  toast.success("Arquivos CSV gerados");
                  trackCtaClick("demo_export_csv", "experimente_page");
                }}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8"
                onClick={() => {
                  exportDemoAsPdf();
                  toast.success("PDF gerado");
                  trackCtaClick("demo_export_pdf", "experimente_page");
                }}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                PDF
              </Button>
            </div>
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
