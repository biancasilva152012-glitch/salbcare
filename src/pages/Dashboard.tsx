import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  GraduationCap,
  Link as LinkIcon,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import PageContainer from "@/components/PageContainer";
import PageSkeleton from "@/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import GuestDashboard from "@/components/guest/GuestDashboard";
import GuestSyncReminderBanner from "@/components/GuestSyncReminderBanner";
import AdminQuickDrawer from "@/components/admin/AdminQuickDrawer";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const formatMoney = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

const greetingForNow = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

const todayIso = () => new Date().toISOString().split("T")[0];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe } = usePushNotifications();
  const [academyDone] = useState(() => {
    try {
      return localStorage.getItem("salbcare_academy_first_lesson_done") === "1";
    } catch {
      return false;
    }
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("name, profile_slug, referral_code, created_at, email, council_number, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin" as const,
      });
      return !!data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const { data: todayAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["dashboard-today-appointments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("appointments")
        .select("id, patient_name, appointment_type, time, status")
        .eq("user_id", user.id)
        .eq("date", todayIso())
        .neq("status", "cancelled")
        .order("time")
        .limit(6);
      return data || [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: patientCount = 0 } = useQuery({
    queryKey: ["dashboard-patient-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const { data: currentMonthTransactions = [] } = useQuery({
    queryKey: ["dashboard-finance-current", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const start = new Date();
      start.setDate(1);
      const { data } = await supabase
        .from("financial_transactions")
        .select("amount, type, date")
        .eq("user_id", user.id)
        .gte("date", start.toISOString().split("T")[0])
        .limit(500);
      return data || [];
    },
    enabled: !!user,
    staleTime: 90_000,
  });

  const { data: previousMonthTransactions = [] } = useQuery({
    queryKey: ["dashboard-finance-previous", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const start = new Date();
      start.setDate(1);
      const previousStart = new Date(start);
      previousStart.setMonth(previousStart.getMonth() - 1);
      const { data } = await supabase
        .from("financial_transactions")
        .select("amount, type, date")
        .eq("user_id", user.id)
        .gte("date", previousStart.toISOString().split("T")[0])
        .lt("date", start.toISOString().split("T")[0])
        .limit(500);
      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const handleEnablePush = async () => {
    const ok = await subscribe();
    if (ok) toast.success("Notificações ativadas.");
    else toast.error("Não foi possível ativar as notificações.");
  };

  const finance = useMemo(() => {
    const income = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const previousIncome = previousMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, result: income - expense, previousIncome };
  }, [currentMonthTransactions, previousMonthTransactions]);

  const pendingAppointments = todayAppointments.filter((appointment) =>
    ["pending", "aguardando_confirmacao", "aguardando_comprovante"].includes(appointment.status),
  ).length;

  const insights = useMemo(() => {
    const list: string[] = [];
    if (pendingAppointments > 0) {
      list.push(`${pendingAppointments} consulta${pendingAppointments > 1 ? "s" : ""} precisam de confirmação.`);
    }
    if (finance.income > 0 && finance.previousIncome > 0) {
      const delta = Math.round(((finance.income - finance.previousIncome) / finance.previousIncome) * 100);
      if (delta > 0) list.push(`Seu faturamento está ${delta}% acima do mês passado.`);
      if (delta < 0) list.push(`Seu faturamento está ${Math.abs(delta)}% abaixo do mês passado.`);
    }
    if (currentMonthTransactions.length === 0) list.push("Nenhuma movimentação financeira foi registrada neste mês.");
    if (patientCount === 0) list.push("Cadastre seu primeiro paciente para ativar o histórico de cuidado.");
    if (list.length === 0) list.push("Seu dia está organizado com os dados disponíveis no SalbCare.");
    return list.slice(0, 3);
  }, [currentMonthTransactions.length, finance.income, finance.previousIncome, patientCount, pendingAppointments]);

  const firstSteps = [
    { label: "Cadastrar primeiro paciente", done: patientCount > 0, action: () => navigate("/dashboard/pacientes") },
    { label: "Lançar primeira receita", done: currentMonthTransactions.some((t) => t.type === "income"), action: () => navigate("/dashboard/financial?type=income&autoOpen=1") },
    { label: "Concluir primeira lição da Academy", done: academyDone, action: () => navigate("/academy") },
  ];
  const showFirstSteps = firstSteps.some((step) => !step.done);
  const bookingToken = profile?.profile_slug || profile?.referral_code || "";
  const bookingLink = bookingToken ? `${window.location.origin}/agendar/${bookingToken}` : "";

  const copyBookingLink = async () => {
    if (!bookingLink) {
      toast.info("Conclua seu perfil para gerar o link de agendamento.");
      return;
    }
    try {
      await navigator.clipboard.writeText(bookingLink);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  if (!user) return <GuestDashboard />;

  if (profileLoading || appointmentsLoading) {
    return <PageContainer><PageSkeleton variant="dashboard" /></PageContainer>;
  }

  return (
    <PageContainer>
      {isAdmin && <AdminQuickDrawer />}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={item}>
          <GuestSyncReminderBanner />
        </motion.div>

        {profile && (!profile.council_number || !profile.phone || !profile.profile_slug) && (
          <motion.section variants={item} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primeiros passos</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">Termine de configurar seu consultório</h2>
            <p className="mt-1 text-sm text-muted-foreground">Complete seu perfil e ative seu link de agendamento para receber pacientes.</p>
            <Button className="mt-3 h-12 w-full gap-2" onClick={() => navigate("/primeiros-passos")}>
              Completar agora <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.section>
        )}

        <motion.header variants={item} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold leading-tight text-foreground">
                {greetingForNow()}, {profile?.name?.split(" ")[0] || "profissional"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Seu consultório em 30 segundos.</p>
            </div>
            {isAdmin && (
              <Button size="icon" variant="outline" aria-label="Abrir administração" onClick={() => navigate("/admin/operacao")}>
                <Shield className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.header>

        {isSupported && !isSubscribed && (
          <motion.div variants={item} className="rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Ative lembretes semanais</p>
                <p className="text-xs text-muted-foreground">Receba avisos para revisar agenda e financeiro.</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleEnablePush} disabled={pushLoading}>Ativar</Button>
            </div>
          </motion.div>
        )}

        <motion.section variants={item} className="grid grid-cols-2 gap-2" aria-label="Seu dia em 30 segundos">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <Calendar className="h-5 w-5 text-secondary" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Consultas hoje</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{todayAppointments.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <DollarSign className="h-5 w-5 text-secondary" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saldo do mês</p>
            <p className="mt-1 truncate font-mono text-2xl font-semibold text-foreground">{formatMoney(finance.result)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <TrendingUp className="h-5 w-5 text-secondary" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Receitas</p>
            <p className="mt-1 truncate font-mono text-xl font-semibold text-foreground">{formatMoney(finance.income)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <Clock className="h-5 w-5 text-secondary" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pendências</p>
            <p className="mt-1 font-mono text-xl font-semibold text-foreground">{pendingAppointments}</p>
          </div>
        </motion.section>

        <motion.section variants={item} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
              <Sparkles className="h-5 w-5 text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SalbCare Copilot</p>
              <h2 className="mt-1 text-lg font-bold leading-snug">Seu copiloto para cuidar da sua prática.</h2>
              <div className="mt-3 space-y-2">
                {insights.map((insight) => (
                  <p key={insight} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    <span>{insight}</span>
                  </p>
                ))}
              </div>
              <Button className="mt-4 w-full gap-2" onClick={() => navigate("/dashboard/mentoria")}>
                Ver insights <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.section>

        {showFirstSteps && (
          <motion.section variants={item} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primeiros passos</p>
            <div className="mt-3 space-y-2">
              {firstSteps.map((step) => (
                <button
                  key={step.label}
                  type="button"
                  onClick={step.action}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-background px-3 text-left transition-colors hover:bg-accent"
                >
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${step.done ? "text-secondary" : "text-muted-foreground"}`} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{step.label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section variants={item} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Próximas consultas</p>
              <h2 className="mt-1 text-lg font-bold">Hoje</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/agenda")}>Agenda</Button>
          </div>
          <div className="mt-3 space-y-2">
            {todayAppointments.slice(0, 3).map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                onClick={() => navigate("/dashboard/agenda")}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-background px-3 text-left hover:bg-accent"
              >
                <span className="font-mono text-sm font-semibold text-foreground">{appointment.time?.slice(0, 5)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{appointment.patient_name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{appointment.appointment_type || "Consulta"}</span>
                </span>
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                  {{
                    scheduled: "Agendada",
                    confirmed: "Confirmada",
                    completed: "Concluída",
                    pending: "Pendente",
                    aguardando_confirmacao: "Aguardando",
                    aguardando_comprovante: "Aguardando",
                  }[appointment.status] || appointment.status}
                </span>
              </button>
            ))}
            {todayAppointments.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                Nenhuma consulta agendada para hoje.
              </div>
            )}
          </div>
        </motion.section>

        <motion.section variants={item} className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/academy")}
            className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent"
          >
            <GraduationCap className="h-5 w-5 text-gold" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Academy</p>
            <h2 className="mt-1 text-lg font-bold">5 minutos para evoluir hoje</h2>
            <p className="mt-2 text-sm text-muted-foreground">Continue Inglês ou Espanhol para atendimento em saúde.</p>
          </button>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <LinkIcon className="h-5 w-5 text-secondary" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Link de agendamento</p>
            <p className="mt-1 truncate text-sm font-medium">{bookingLink || "Conclua seu perfil"}</p>
            <Button variant="outline" className="mt-3 w-full gap-2" onClick={copyBookingLink}>
              <Copy className="h-4 w-4" /> Copiar link
            </Button>
          </div>
        </motion.section>

        {isAdmin && (
          <motion.div variants={item}>
            <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/admin/operacao")}>
              <Users className="h-4 w-4" /> Gerenciar operação
            </Button>
          </motion.div>
        )}
      </motion.div>
    </PageContainer>
  );
};

export default Dashboard;
