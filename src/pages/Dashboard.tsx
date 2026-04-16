import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DollarSign, Calendar, Users, Video, Clock, TrendingUp,
  Sparkles, MessageCircle, Rocket,
  BookOpen, Scale, Shield, Bell
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import PageContainer from "@/components/PageContainer";
import PageSkeleton from "@/components/PageSkeleton";
import ActivationOnboarding from "@/components/ActivationOnboarding";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import InstallBanner from "@/components/InstallBanner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe } = usePushNotifications();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, profile_slug, referral_code, created_at, email")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: monthlyIncome = 0 } = useQuery({
    queryKey: ["monthly-income", user?.id],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("user_id", user!.id)
        .eq("type", "income")
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .limit(500);
      return (data || []).reduce((sum, t) => sum + Number(t.amount), 0);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const { data: todayCount = 0 } = useQuery({
    queryKey: ["today-appointments", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("date", today)
        .eq("status", "scheduled");
      return count || 0;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin" as const,
      });
      return !!data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const handleEnablePush = async () => {
    const ok = await subscribe();
    if (ok) {
      toast.success("Notificações ativadas! Você será lembrado semanalmente.");
    } else {
      toast.error("Não foi possível ativar as notificações. Verifique as permissões do navegador.");
    }
  };

  // Daily AI insight
  const { data: dailyInsight } = useQuery({
    queryKey: ["daily-insight", user?.id],
    queryFn: async () => {
      const insights = [
        { text: "Registre seus recebimentos de hoje para manter seu diagnóstico financeiro atualizado.", icon: "📊" },
        { text: "Profissionais que registram receitas semanalmente economizam até 30% em impostos.", icon: "💡" },
        { text: "Seu perfil público ajuda pacientes a te encontrarem. Mantenha-o atualizado!", icon: "🔍" },
        { text: "Agende consultas pela plataforma e tenha controle total do seu faturamento.", icon: "📅" },
        { text: "Use a mentora financeira para entender para onde vai seu dinheiro este mês.", icon: "🤖" },
      ];
      const dayIndex = new Date().getDate() % insights.length;
      return insights[dayIndex];
    },
    enabled: !!user,
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) return <PageContainer><PageSkeleton variant="dashboard" /></PageContainer>;

  const quickAccess = [
    { icon: BookOpen, label: "Contabilidade", to: "/dashboard/contabilidade", color: "text-primary" },
    { icon: DollarSign, label: "Financeiro", to: "/dashboard/financial", color: "text-primary" },
    { icon: Calendar, label: "Agenda", to: "/dashboard/agenda", color: "text-primary" },
    { icon: Users, label: "Pacientes", to: "/dashboard/pacientes", color: "text-primary" },
    { icon: Video, label: "Teleconsulta", to: "/dashboard/teleconsulta", color: "text-primary" },
    { icon: Scale, label: "Jurídico", to: "/dashboard/juridico", color: "text-primary" },
  ];

  return (
    <PageContainer>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {/* Daily Insight */}
        {dailyInsight && (
          <motion.div variants={item}>
            <button
              onClick={() => navigate("/dashboard/mentoria")}
              className="glass-card w-full p-3 text-left transition-all active:scale-[0.98] hover:border-primary/50 flex items-center gap-3 border-primary/20 bg-primary/5"
            >
              <span className="text-xl">{dailyInsight.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Insight do dia</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{dailyInsight.text}</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* Greeting */}
        <motion.div variants={item} className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Bem-vindo(a) de volta</p>
          <h1 className="text-xl font-bold sm:text-2xl">{profile?.name || "Profissional"}</h1>
        </motion.div>

        {/* PWA Install Banner */}
        <motion.div variants={item}>
          <InstallBanner />
        </motion.div>

        {/* Push Notification Banner */}
        {isSupported && !isSubscribed && (
          <motion.div variants={item}>
            <div className="glass-card p-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">Ative lembretes semanais</p>
                <p className="text-[10px] text-muted-foreground">Receba um lembrete para registrar seus recebimentos</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-xs"
                onClick={handleEnablePush}
                disabled={pushLoading}
              >
                Ativar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stats Row */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Hoje</p>
              <p className="text-lg font-bold">{todayCount}</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Saldo</p>
              <p className="text-lg font-bold">R$ {monthlyIncome.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </motion.div>

        {/* Mentoria Card - Highlight */}
        <motion.div variants={item}>
          <button
            onClick={() => navigate("/dashboard/mentoria")}
            className="glass-card w-full p-4 text-left transition-all active:scale-[0.98] hover:border-primary/50 flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Mentora Financeira com IA</p>
              <p className="text-xs text-muted-foreground">Insights personalizados sobre seus números</p>
            </div>
          </button>
        </motion.div>

        {/* Fale com Contador */}
        <motion.div variants={item}>
          <button
            onClick={() => navigate("/dashboard/contabilidade")}
            className="glass-card w-full p-4 text-left transition-all active:scale-[0.98] hover:border-primary/50 flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <MessageCircle className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Fale com um Contador</p>
              <p className="text-xs text-muted-foreground">NF, CNPJ, IR e dúvidas contábeis</p>
            </div>
          </button>
        </motion.div>

        {/* Quick Access Grid */}
        <motion.div variants={item}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Acesso rápido</p>
          <div className="grid grid-cols-3 gap-3">
            {quickAccess.map(({ icon: Icon, label, to }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="glass-card p-4 flex flex-col items-center gap-2 transition-all active:scale-[0.97] hover:border-primary/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-center">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Admin Panel */}
        {isAdmin && (
          <motion.div variants={item}>
            <button
              onClick={() => navigate("/admin")}
              className="glass-card w-full p-4 text-left transition-all active:scale-[0.98] hover:border-destructive/50 flex items-center gap-3 border-destructive/20"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold">Painel Admin</p>
                <p className="text-xs text-muted-foreground">Gerenciar assinaturas e usuários</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* Today's appointments */}
        <motion.div variants={item}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Consultas de hoje</p>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {todayCount === 0
                ? "Nenhuma consulta agendada para hoje"
                : `${todayCount} consulta${todayCount > 1 ? "s" : ""} agendada${todayCount > 1 ? "s" : ""}`}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
};

export default Dashboard;
