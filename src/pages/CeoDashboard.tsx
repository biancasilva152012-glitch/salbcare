import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/config/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Shield, Users, Calendar, DollarSign, Loader2, Search,
  UserCheck, UserX, Eye, TrendingUp, Building2, FlaskConical,
  Bell, Settings, ArrowLeft, Stethoscope, BarChart3, Activity,
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const PLAN_LABELS: Record<string, string> = {
  basic: "Essencial",
  professional: "Profissional",
  clinic: "Clínica",
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: "Ativo", cls: "bg-green-500/10 text-green-600 border-green-500/20" },
  trialing: { label: "Trial", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  canceled: { label: "Inativo", cls: "bg-red-500/10 text-red-600 border-red-500/20" },
  past_due: { label: "Inadimplente", cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  none: { label: "Sem plano", cls: "bg-muted text-muted-foreground border-border" },
  pending: { label: "Pendente", cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const CeoDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [examRequests, setExamRequests] = useState<any[]>([]);
  const [partnerInterests, setPartnerInterests] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Filters
  const [searchPro, setSearchPro] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchPatient, setSearchPatient] = useState("");
  const [searchAppt, setSearchAppt] = useState("");

  // Dialogs
  const [editPlanDialog, setEditPlanDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [newPlan, setNewPlan] = useState("basic");
  const [planReason, setPlanReason] = useState("");
  const [planValidUntil, setPlanValidUntil] = useState("");

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    if (!isAdminEmail(user.email)) {
      navigate("/dashboard", { replace: true });
      return;
    }
    setAuthorized(true);
  }, [user, authLoading, navigate]);

  // Load all data
  useEffect(() => {
    if (!authorized) return;
    const load = async () => {
      setLoading(true);
      const [profRes, patientsRes, apptRes, examRes, partnerRes, profilesRes] = await Promise.all([
        supabase.from("professionals").select("*").order("created_at", { ascending: false }),
        supabase.from("patients").select("*").order("created_at", { ascending: false }),
        supabase.from("appointments").select("*").order("date", { ascending: false }),
        supabase.from("exam_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("partner_interests").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      ]);
      setProfessionals(profRes.data || []);
      setPatients(patientsRes.data || []);
      setAppointments(apptRes.data || []);
      setExamRequests(examRes.data || []);
      setPartnerInterests(partnerRes.data || []);
      setProfiles(profilesRes.data || []);
      setLoading(false);
    };
    load();
  }, [authorized]);

  // Stats
  const totalProfessionals = profiles.filter(p => p.user_type === "professional").length;
  const totalPatients = profiles.filter(p => p.user_type === "patient").length;
  const totalAppointments = appointments.length;
  const estimatedMRR = useMemo(() => {
    let mrr = 0;
    for (const p of professionals) {
      if (p.subscription_status === "active" || p.subscription_status === "trialing") {
        if (p.plan === "clinic") mrr += 189;
        else if (p.plan === "professional") mrr += 99;
        else mrr += 49;
      }
    }
    return mrr;
  }, [professionals]);

  // Filtered professionals
  const filteredPros = useMemo(() => {
    const proProfiles = profiles.filter(p => p.user_type === "professional");
    return proProfiles.filter(p => {
      const matchSearch = !searchPro || p.name?.toLowerCase().includes(searchPro.toLowerCase()) || p.email?.toLowerCase().includes(searchPro.toLowerCase());
      const matchPlan = filterPlan === "all" || p.plan === filterPlan;
      const matchStatus = filterStatus === "all" || p.payment_status === filterStatus;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [profiles, searchPro, filterPlan, filterStatus]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    const patProfiles = profiles.filter(p => p.user_type === "patient");
    return patProfiles.filter(p => {
      return !searchPatient || p.name?.toLowerCase().includes(searchPatient.toLowerCase()) || p.email?.toLowerCase().includes(searchPatient.toLowerCase());
    });
  }, [profiles, searchPatient]);

  // Charts data
  const monthlyRegistrations = useMemo(() => {
    const months: Record<string, { pros: number; patients: number }> = {};
    for (const p of profiles) {
      const month = format(new Date(p.created_at), "MMM/yy", { locale: ptBR });
      if (!months[month]) months[month] = { pros: 0, patients: 0 };
      if (p.user_type === "professional") months[month].pros++;
      else months[month].patients++;
    }
    return Object.entries(months).slice(-6).map(([name, val]) => ({ name, ...val }));
  }, [profiles]);

  const planDistribution = useMemo(() => {
    const dist: Record<string, number> = { basic: 0, professional: 0, clinic: 0 };
    for (const p of profiles.filter(p => p.user_type === "professional")) {
      dist[p.plan || "basic"] = (dist[p.plan || "basic"] || 0) + 1;
    }
    return Object.entries(dist).map(([name, value]) => ({ name: PLAN_LABELS[name] || name, value }));
  }, [profiles]);

  const monthlyAppointments = useMemo(() => {
    const months: Record<string, number> = {};
    for (const a of appointments) {
      const month = format(new Date(a.date), "MMM/yy", { locale: ptBR });
      months[month] = (months[month] || 0) + 1;
    }
    return Object.entries(months).slice(-6).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  // Handle plan edit
  const handleSavePlan = async () => {
    if (!editTarget) return;
    const { error } = await supabase
      .from("profiles")
      .update({ plan: newPlan })
      .eq("user_id", editTarget.user_id);
    if (error) {
      toast.error("Erro ao alterar plano.");
    } else {
      toast.success(`Plano de ${editTarget.name} alterado para ${PLAN_LABELS[newPlan]}`);
      setProfiles(prev => prev.map(p => p.user_id === editTarget.user_id ? { ...p, plan: newPlan } : p));
    }
    setEditPlanDialog(false);
    setPlanReason("");
    setPlanValidUntil("");
  };

  const handleSuspend = async (profile: any) => {
    const { error } = await supabase
      .from("profiles")
      .update({ payment_status: "suspended" })
      .eq("user_id", profile.user_id);
    if (error) toast.error("Erro ao suspender.");
    else {
      toast.success(`${profile.name} suspenso.`);
      setProfiles(prev => prev.map(p => p.user_id === profile.user_id ? { ...p, payment_status: "suspended" } : p));
    }
  };

  const handleUpdateExamStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("exam_requests").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar.");
    else {
      toast.success("Status atualizado!");
      setExamRequests(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    }
  };

  if (authLoading || authorized === null || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Painel CEO</h1>
            <p className="text-xs text-muted-foreground">Visão completa da plataforma SALBCARE</p>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Stethoscope, label: "Profissionais", value: totalProfessionals, color: "text-blue-500" },
            { icon: Users, label: "Pacientes", value: totalPatients, color: "text-green-500" },
            { icon: Calendar, label: "Consultas", value: totalAppointments, color: "text-purple-500" },
            { icon: DollarSign, label: "MRR estimado", value: `R$ ${estimatedMRR}`, color: "text-primary" },
          ].map((kpi) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-4 text-center">
              <kpi.icon className={`h-5 w-5 mx-auto mb-1 ${kpi.color}`} />
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="professionals" className="space-y-4">
          <TabsList className="flex flex-wrap w-full bg-accent gap-1 h-auto p-1">
            <TabsTrigger value="professionals" className="text-xs gap-1 flex-1 min-w-fit"><Stethoscope className="h-3.5 w-3.5" />Profissionais</TabsTrigger>
            <TabsTrigger value="patients" className="text-xs gap-1 flex-1 min-w-fit"><Users className="h-3.5 w-3.5" />Pacientes</TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs gap-1 flex-1 min-w-fit"><Calendar className="h-3.5 w-3.5" />Consultas</TabsTrigger>
            <TabsTrigger value="exams" className="text-xs gap-1 flex-1 min-w-fit"><FlaskConical className="h-3.5 w-3.5" />Exames</TabsTrigger>
            <TabsTrigger value="partners" className="text-xs gap-1 flex-1 min-w-fit"><Building2 className="h-3.5 w-3.5" />Parceiros</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs gap-1 flex-1 min-w-fit"><BarChart3 className="h-3.5 w-3.5" />Métricas</TabsTrigger>
            <TabsTrigger value="plans" className="text-xs gap-1 flex-1 min-w-fit"><Settings className="h-3.5 w-3.5" />Planos</TabsTrigger>
          </TabsList>

          {/* PROFESSIONALS TAB */}
          <TabsContent value="professionals" className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar por nome ou e-mail..." value={searchPro} onChange={e => setSearchPro(e.target.value)} className="pl-8 text-xs h-8" />
              </div>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos planos</SelectItem>
                  <SelectItem value="basic">Essencial</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="clinic">Clínica</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="none">Sem pagamento</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">{filteredPros.length} profissional(is)</p>
            <div className="overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">E-mail</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Conselho</TableHead>
                    <TableHead className="text-xs">Plano</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Cadastro</TableHead>
                    <TableHead className="text-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPros.map(p => {
                    const status = STATUS_MAP[p.payment_status] || STATUS_MAP.none;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-medium">{p.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.email}</TableCell>
                        <TableCell className="text-xs capitalize">{p.professional_type}</TableCell>
                        <TableCell className="text-xs">{p.council_number || "—"}{p.council_state ? `/${p.council_state}` : ""}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{PLAN_LABELS[p.plan] || p.plan}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className={`text-[10px] ${status.cls}`}>{status.label}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yy")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => { setEditTarget(p); setNewPlan(p.plan || "basic"); setEditPlanDialog(true); }}>Editar plano</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive" onClick={() => handleSuspend(p)}>Suspender</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* PATIENTS TAB */}
          <TabsContent value="patients" className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar paciente..." value={searchPatient} onChange={e => setSearchPatient(e.target.value)} className="pl-8 text-xs h-8" />
            </div>
            <p className="text-xs text-muted-foreground">{filteredPatients.length} paciente(s)</p>
            <div className="overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">E-mail</TableHead>
                    <TableHead className="text-xs">Telefone</TableHead>
                    <TableHead className="text-xs">Cadastro</TableHead>
                    <TableHead className="text-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs font-medium">{p.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.email}</TableCell>
                      <TableCell className="text-xs">{p.phone || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yy")}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive" onClick={() => handleSuspend(p)}>Suspender</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* APPOINTMENTS TAB */}
          <TabsContent value="appointments" className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar consulta..." value={searchAppt} onChange={e => setSearchAppt(e.target.value)} className="pl-8 text-xs h-8" />
            </div>
            <p className="text-xs text-muted-foreground">{appointments.length} consulta(s)</p>
            <div className="overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Horário</TableHead>
                    <TableHead className="text-xs">Paciente</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments
                    .filter(a => !searchAppt || a.patient_name?.toLowerCase().includes(searchAppt.toLowerCase()))
                    .slice(0, 100)
                    .map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">{format(new Date(a.date), "dd/MM/yy")}</TableCell>
                      <TableCell className="text-xs">{a.time}</TableCell>
                      <TableCell className="text-xs font-medium">{a.patient_name}</TableCell>
                      <TableCell className="text-xs capitalize">{a.appointment_type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${a.status === "completed" ? "bg-green-500/10 text-green-600" : a.status === "cancelled" ? "bg-red-500/10 text-red-600" : "bg-blue-500/10 text-blue-600"}`}>
                          {a.status === "completed" ? "Realizada" : a.status === "cancelled" ? "Cancelada" : a.status === "scheduled" ? "Agendada" : a.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* EXAMS TAB */}
          <TabsContent value="exams" className="space-y-3">
            <p className="text-xs text-muted-foreground">{examRequests.length} solicitação(ões) de exame</p>
            <div className="overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Exame</TableHead>
                    <TableHead className="text-xs">Laboratório</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examRequests.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">{format(new Date(e.created_at), "dd/MM/yy")}</TableCell>
                      <TableCell className="text-xs font-medium">{e.exam_type}</TableCell>
                      <TableCell className="text-xs">{e.lab_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${e.status === "completed" ? "bg-green-500/10 text-green-600" : e.status === "scheduled" ? "bg-blue-500/10 text-blue-600" : "bg-yellow-500/10 text-yellow-600"}`}>
                          {e.status === "completed" ? "Realizado" : e.status === "scheduled" ? "Agendado" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => handleUpdateExamStatus(e.id, "scheduled")}>Agendar</Button>
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-green-600" onClick={() => handleUpdateExamStatus(e.id, "completed")}>Concluir</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* PARTNERS TAB */}
          <TabsContent value="partners" className="space-y-3">
            <p className="text-xs text-muted-foreground">{partnerInterests.length} parceiro(s) interessado(s)</p>
            <div className="space-y-2">
              {partnerInterests.map(p => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{p.company_name}</p>
                      <p className="text-xs text-muted-foreground">{p.contact_name} — {p.email}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{p.partner_type === "farmacia" ? "🏪 Farmácia" : "🔬 Laboratório"}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                    <span>📍 {p.city}</span>
                    <span>📞 {p.phone || "—"}</span>
                    <span>📋 Plano: {p.plan_interest || "básico"}</span>
                    <span>📅 {format(new Date(p.created_at), "dd/MM/yy")}</span>
                  </div>
                </motion.div>
              ))}
              {partnerInterests.length === 0 && (
                <div className="glass-card p-6 text-center text-sm text-muted-foreground">Nenhum parceiro cadastrado ainda.</div>
              )}
            </div>
          </TabsContent>

          {/* METRICS TAB */}
          <TabsContent value="metrics" className="space-y-6">
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">📈 Novos cadastros por mês</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="pros" name="Profissionais" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="patients" name="Pacientes" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">📅 Consultas por mês</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyAppointments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" name="Consultas" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">📊 Distribuição de planos</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={planDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {planDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* PLAN MANAGEMENT TAB */}
          <TabsContent value="plans" className="space-y-3">
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-sm font-semibold">⚙️ Gerenciar planos manualmente</h3>
              <p className="text-xs text-muted-foreground">Busque um profissional e altere o plano. Útil para embaixadores, parceiros estratégicos ou inadimplentes.</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar profissional por nome ou e-mail..." value={searchPro} onChange={e => setSearchPro(e.target.value)} className="pl-8 text-xs h-8" />
              </div>
            </div>
            <div className="space-y-2">
              {filteredPros.slice(0, 20).map(p => (
                <div key={p.id} className="glass-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.email} — {PLAN_LABELS[p.plan] || p.plan}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => { setEditTarget(p); setNewPlan(p.plan || "basic"); setEditPlanDialog(true); }}>
                    Alterar plano
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={editPlanDialog} onOpenChange={setEditPlanDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Alterar plano</DialogTitle>
            <DialogDescription className="text-xs">{editTarget?.name} — {editTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Novo plano</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Essencial</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="clinic">Clínica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Motivo da alteração</Label>
              <Input placeholder="Ex: embaixador, parceiro, cortesia..." value={planReason} onChange={e => setPlanReason(e.target.value)} className="text-xs h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Válido até (opcional)</Label>
              <Input type="date" value={planValidUntil} onChange={e => setPlanValidUntil(e.target.value)} className="text-xs h-8" />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" className="w-full text-xs" onClick={handleSavePlan}>Aplicar alteração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CeoDashboard;
