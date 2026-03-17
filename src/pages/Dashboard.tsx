import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Users, Video, DollarSign, Calculator, Scale, Clock, TrendingUp, Lock, UserCog, Shield, MessageCircle, Bell } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";
import PageSkeleton from "@/components/PageSkeleton";
import WelcomeOnboarding from "@/components/WelcomeOnboarding";
import InstallBanner from "@/components/InstallBanner";
import TrialCountdown from "@/components/TrialCountdown";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureGate, Feature } from "@/hooks/useFeatureGate";
import { openVersionedSubscriptionRoute } from "@/utils/subscriptionNavigation";
import ConnectOnboardingBanner from "@/components/ConnectOnboardingBanner";

interface QuickAction {
  icon: typeof Calendar;
  label: string;
  to: string;
  color: string;
  requiredFeature?: Feature;
  highlight?: boolean;
}

const quickActions: QuickAction[] = [
  { icon: Calculator, label: "Contabilidade", to: "/accounting", color: "from-primary to-secondary", highlight: true },
  { icon: DollarSign, label: "Financeiro", to: "/financial", color: "from-primary to-secondary" },
  { icon: Calendar, label: "Agenda", to: "/agenda", color: "from-primary to-secondary" },
  { icon: Users, label: "Pacientes", to: "/patients", color: "from-primary to-secondary" },
  { icon: Video, label: "Teleconsulta", to: "/telehealth", color: "from-primary to-secondary" },
  { icon: Scale, label: "Jurídico", to: "/legal", color: "from-primary to-secondary" },
  { icon: UserCog, label: "Equipe", to: "/professionals", requiredFeature: "multi_professionals", color: "from-primary to-secondary" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccess } = useFeatureGate();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["today-appointments", user?.id] });
    await queryClient.invalidateQueries({ queryKey: ["monthly-balance", user?.id] });
  }, [queryClient, user?.id]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const today = new Date().toISOString().split("T")[0];

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ["today-appointments", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select("*").eq("user_id", user!.id).eq("date", today).eq("status", "scheduled").order("time");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("is_admin_or_contador", { _user_id: user!.id });
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: monthlyBalance } = useQuery({
    queryKey: ["monthly-balance", user?.id],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data } = await supabase.from("financial_transactions").select("amount, type").eq("user_id", user!.id).gte("date", startOfMonth.toISOString().split("T")[0]);
      const income = (data || []).filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      const expense = (data || []).filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      return income - expense;
    },
    enabled: !!user,
  });

  if (profileLoading) {
    return <PageContainer><PageSkeleton variant="dashboard" /></PageContainer>;
  }

  return (
    <PageContainer onRefresh={handleRefresh}>
      <WelcomeOnboarding />
      <InstallBanner />
      <TrialCountdown />
      <ConnectOnboardingBanner
        pixKey={(profile as any)?.pix_key}
        cardLink={(profile as any)?.card_link}
      />
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
        {/* Greeting — tighter on mobile */}
        <motion.div variants={item} className="space-y-0.5">
          <p className="text-xs text-muted-foreground">
            {profile?.created_at && (new Date().getTime() - new Date(profile.created_at).getTime()) < 60000
              ? "Bem-vindo(a) ao SalbCare! 🎉"
              : "Bem-vindo(a) de volta"}
          </p>
          <h1 className="text-xl font-bold sm:text-2xl">{profile?.name || "Profissional"}</h1>
        </motion.div>

        {/* Captação Banner */}
        <motion.div variants={item}>
          <button
            onClick={() => navigate("/profile?tab=consultation")}
            className="glass-card ring-1 ring-green-500/20 flex w-full items-center gap-3 p-3 sm:p-4 transition-all active:scale-[0.98] hover:border-green-500/50 bg-green-500/5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-500/10 sm:h-10 sm:w-10">
              <span className="text-lg">🚀</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold">Pacientes novos pela SALBCARE</p>
              <p className="truncate text-[11px] text-muted-foreground">Configure seus horários e valor para receber agendamentos.</p>
            </div>
          </button>
        </motion.div>

        {/* Stats row — compact cards */}
        <motion.div variants={item} className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="glass-card flex items-center gap-3 p-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Hoje</p>
              <p className="text-lg font-bold leading-tight sm:text-2xl">{todayAppointments.length}</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3 p-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Saldo</p>
              <p className="truncate text-lg font-bold leading-tight sm:text-2xl">
                R$&nbsp;{(monthlyBalance ?? 0).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA Contador — more compact */}
        <motion.div variants={item}>
          <button
            onClick={() => navigate("/accounting?tab=chat")}
            className="glass-card ring-1 ring-primary/20 flex w-full items-center gap-3 p-3 sm:p-4 transition-all active:scale-[0.98] hover:border-primary/50"
          >
            <div className="gradient-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10">
              <MessageCircle className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold">Fale com um Contador</p>
              <p className="truncate text-[11px] text-muted-foreground">NF, CNPJ, IR e dúvidas contábeis</p>
            </div>
          </button>
        </motion.div>

        {/* Quick actions — responsive 4-col on wider, 3-col default */}
        <motion.div variants={item}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:mb-3 sm:text-sm">
            Acesso rápido
          </h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 sm:gap-3">
            {quickActions.map(({ icon: Icon, label, to, requiredFeature, highlight }) => {
              const locked = requiredFeature && !hasAccess(requiredFeature);

              return (
                <button
                  key={to}
                  onClick={() => (locked ? openVersionedSubscriptionRoute() : navigate(to))}
                  className={`glass-card relative flex flex-col items-center gap-1.5 p-3 sm:gap-2 sm:p-4 transition-all active:scale-95 ${
                    locked ? "opacity-70 hover:border-primary/30" : "hover:border-primary/50"
                  } ${highlight ? "ring-1 ring-primary/30" : ""}`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${
                      locked ? "bg-muted" : "gradient-primary"
                    }`}
                  >
                    {locked ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium leading-tight sm:text-xs">{label}</span>
                  {locked && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 py-0.5 text-[8px] font-bold text-primary-foreground sm:text-[9px]">
                      PRO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Admin panel */}
        {isAdmin && (
          <motion.div variants={item}>
            <button
              onClick={() => navigate("/admin")}
              className="glass-card flex w-full items-center gap-3 p-3 sm:p-4 transition-all active:scale-[0.98] hover:border-primary/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 sm:h-10 sm:w-10">
                <Shield className="h-4 w-4 text-destructive sm:h-5 sm:w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Painel Admin</p>
                <p className="text-[11px] text-muted-foreground">Gerenciar assinaturas e usuários</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* Today's appointments */}
        <motion.div variants={item}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:mb-3 sm:text-sm">
            Consultas de hoje
          </h2>
          <div className="space-y-2">
            {todayAppointments.length === 0 && (
              <p className="py-3 text-center text-xs text-muted-foreground sm:py-4 sm:text-sm">
                Nenhuma consulta agendada para hoje
              </p>
            )}
            {todayAppointments.map((appointment) => (
              <div key={appointment.id} className="glass-card flex items-center justify-between p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="bg-accent text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:h-10 sm:w-10 sm:text-sm">
                    {appointment.patient_name.split(" ").map((name: string) => name[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{appointment.patient_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {appointment.appointment_type === "presencial" ? "Presencial" : "Teleconsulta"}
                    </p>
                  </div>
                </div>
                <span className="ml-2 shrink-0 text-sm font-semibold text-primary">{appointment.time.substring(0, 5)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
};

export default Dashboard;
