import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Users, Video, DollarSign, Calculator, Scale, Clock, TrendingUp, Lock, UserCog, Shield, MessageCircle } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import PageSkeleton from "@/components/PageSkeleton";
import WelcomeOnboarding from "@/components/WelcomeOnboarding";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useFeatureGate, Feature } from "@/hooks/useFeatureGate";

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
  { icon: Video, label: "Telehealth", to: "/telehealth", color: "from-primary to-secondary" },
  { icon: Scale, label: "Jurídico", to: "/legal", color: "from-primary to-secondary" },
  { icon: UserCog, label: "Equipe", to: "/professionals", requiredFeature: "multi_professionals", color: "from-primary to-secondary" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccess } = useFeatureGate();

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
  });

  const { data: monthlyBalance } = useQuery({
    queryKey: ["monthly-balance", user?.id],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data } = await supabase.from("financial_transactions").select("amount, type").eq("user_id", user!.id).gte("date", startOfMonth.toISOString().split("T")[0]);
      const income = (data || []).filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expense = (data || []).filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      return income - expense;
    },
    enabled: !!user,
  });

  return (
    <PageContainer>
      <WelcomeOnboarding />
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <p className="text-sm text-muted-foreground">
            {profile?.created_at && (new Date().getTime() - new Date(profile.created_at).getTime()) < 60000
              ? "Bem-vindo(a) ao SalbCare! 🎉"
              : "Bem-vindo(a) de volta"}
          </p>
          <h1 className="text-2xl font-bold">{profile?.name || "Profissional"}</h1>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium text-muted-foreground">Consultas hoje</span>
            </div>
            <p className="text-2xl font-bold">{todayAppointments.length}</p>
          </div>
          <div className="glass-card p-4 space-y-1">
            <div className="flex items-center gap-2 text-success">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium text-muted-foreground">Saldo mensal</span>
            </div>
            <p className="text-2xl font-bold">R$ {(monthlyBalance ?? 0).toLocaleString("pt-BR")}</p>
          </div>
        </motion.div>

        {/* CTA Assessoria contábil */}
        <motion.div variants={item}>
          <button
            onClick={() => navigate("/accounting?tab=chat")}
            className="glass-card flex w-full items-center gap-3 p-4 transition-all active:scale-[0.98] hover:border-primary/50 ring-1 ring-primary/20"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shrink-0">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold">Fale com um Contador</p>
              <p className="text-xs text-muted-foreground">NF, CNPJ, IR e dúvidas contábeis — resolvemos tudo pra você</p>
            </div>
          </button>
        </motion.div>

        <motion.div variants={item}>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Acesso rápido</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map(({ icon: Icon, label, to, requiredFeature, highlight }) => {
              const locked = requiredFeature && !hasAccess(requiredFeature);
              return (
                <button
                  key={to}
                  onClick={() => navigate(locked ? "/subscription" : to)}
                  className={`glass-card relative flex flex-col items-center gap-2 p-4 transition-all active:scale-95 ${locked ? "opacity-70 hover:border-primary/30" : "hover:border-primary/50"} ${highlight ? "ring-1 ring-primary/30" : ""}`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${locked ? "bg-muted" : "gradient-primary"}`}>
                    {locked ? <Lock className="h-5 w-5 text-muted-foreground" /> : <Icon className="h-5 w-5 text-primary-foreground" />}
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                  {locked && (
                    <span className="absolute -top-1.5 -right-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                      PRO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {isAdmin && (
          <motion.div variants={item}>
            <button
              onClick={() => navigate("/admin")}
              className="glass-card flex w-full items-center gap-3 p-4 transition-all active:scale-[0.98] hover:border-primary/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Painel Admin</p>
                <p className="text-xs text-muted-foreground">Gerenciar assinaturas e usuários</p>
              </div>
            </button>
          </motion.div>
        )}

        <motion.div variants={item}>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Consultas de hoje</h2>
          <div className="space-y-2">
            {todayAppointments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma consulta agendada para hoje</p>
            )}
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="glass-card flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                    {apt.patient_name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{apt.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{apt.appointment_type === "presencial" ? "Presencial" : "Telehealth"}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary">{apt.time.substring(0, 5)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
};

export default Dashboard;
