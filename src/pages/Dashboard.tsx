import { useState } from "react";
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
import GuestDashboard from "@/components/guest/GuestDashboard";
import GuestSyncReminderBanner from "@/components/GuestSyncReminderBanner";

import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import { useFinancialHealth } from "@/hooks/useFinancialHealth";
import FinancialDiagnosisBanner from "@/components/financial/FinancialDiagnosisBanner";
import FinancialHealthProgress from "@/components/financial/FinancialHealthProgress";
import AIPreviewLockedCard from "@/components/financial/AIPreviewLockedCard";
import SmartTrialNotification from "@/components/financial/SmartTrialNotification";
import FinancialOnboardingWizard from "@/components/financial/FinancialOnboardingWizard";
import UpgradeModal from "@/components/UpgradeModal";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPaid } = useFreemiumLimits();
  if (!user) {
    return <GuestDashboard />;
  }
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe } = usePushNotifications();
  const financialHealth = useFinancialHealth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const openUpgrade = () => setUpgradeOpen(true);

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

  const { data: patientCount = -1 } = useQuery({
    queryKey: ["patient-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const handleEnablePush = async () => {
    const ok = await subscribe();
    if (ok) {
      toast.success("Notificações ativadas! Você será lembrado semanalmente.");
    } else {
      toast.error("Não foi possível ativar as notificações. Verifique as permissões do navegador.");
    }
  };

  // Monthly expenses + transaction count to power the personalized insight
  const { data: financeStats } = useQuery({
    queryKey: ["finance-stats", user?.id],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data } = await supabase
        .from("financial_transactions")
        .select("amount, type")
        .eq("user_id", user!.id)
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .limit(500);
      const list = data || [];
      const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      return { expense, total: list.length };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Daily AI insight — usa dados reais para criar um gancho conversacional
  // que leva o profissional a abrir uma conversa com a Mentora IA.
  const dailyInsight = (() => {
    const expense = financeStats?.expense ?? 0;
    const txCount = financeStats?.total ?? 0;
    const profit = monthlyIncome - expense;

    if (txCount === 0) {
      return {
        icon: "📊",
        text: "Lance sua primeira receita do mês e a Mentora IA já te mostra um diagnóstico financeiro personalizado.",
        cta: "Conversar com a Mentora",
      };
    }
    if (monthlyIncome > 0 && expense === 0) {
      return {
        icon: "💡",
        text: `Você já recebeu R$ ${monthlyIncome.toLocaleString("pt-BR")} este mês. Pergunte para a Mentora IA quanto deve guardar para imposto.`,
        cta: "Perguntar agora",
      };
    }
    if (expense > monthlyIncome && monthlyIncome > 0) {
      return {
        icon: "⚠️",
        text: `Suas despesas (R$ ${expense.toLocaleString("pt-BR")}) passaram das receitas. Quer entender o que está pesando? A Mentora IA te ajuda.`,
        cta: "Investigar com a IA",
      };
    }
    if (profit > 0) {
      return {
        icon: "🤖",
        text: `Seu lucro este mês é R$ ${profit.toLocaleString("pt-BR")}. Pergunte para a Mentora IA: vale a pena abrir CNPJ ou ainda compensa pessoa física?`,
        cta: "Tirar essa dúvida",
      };
    }
    return {
      icon: "🔍",
      text: `Você lançou ${txCount} ${txCount === 1 ? "movimentação" : "movimentações"} este mês. Quer um resumo inteligente direto da Mentora IA?`,
      cta: "Pedir resumo",
    };
  })();

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
        {/* Auto-sync reminder when guest data is still pending */}
        <motion.div variants={item}>
          <GuestSyncReminderBanner />
        </motion.div>

        {/* Engajamento financeiro progressivo */}
        {!financialHealth.isLoading && (
          <>
            {financialHealth.isEmpty && (
              <motion.div variants={item}>
                <FinancialDiagnosisBanner hidden={false} />
              </motion.div>
            )}

            {financialHealth.onboardingStep !== null && (
              <motion.div variants={item}>
                <FinancialOnboardingWizard
                  health={financialHealth}
                  onOpenMentor={() => navigate("/dashboard/mentoria")}
                />
              </motion.div>
            )}

            {!financialHealth.isEmpty && (
              <motion.div variants={item}>
                <FinancialHealthProgress
                  steps={financialHealth.steps}
                  progressPercent={financialHealth.progressPercent}
                  onPremiumStepClick={openUpgrade}
                  mentorUnlocks={financialHealth.mentorUnlocks}
                />
              </motion.div>
            )}

            {financialHealth.trialExpiredNotConverted &&
              financialHealth.hasMinimumForSmartNotification && (
                <motion.div variants={item}>
                  <SmartTrialNotification
                    monthlyIncome={financialHealth.monthlyIncome}
                    onUpgrade={openUpgrade}
                  />
                </motion.div>
              )}

            {financialHealth.hasMinimumForPreview &&
              !financialHealth.steps.find((s) => s.id === "ai_analysis")?.done && (
                <motion.div variants={item}>
                  <AIPreviewLockedCard onUpgrade={openUpgrade} />
                </motion.div>
              )}
          </>
        )}

        {/* Daily Insight */}
        {dailyInsight && (
          <motion.div variants={item}>
            <button
              onClick={() => navigate("/dashboard/mentoria")}
              className="glass-card w-full p-3 text-left transition-all active:scale-[0.98] hover:border-primary/50 flex items-start gap-3 border-primary/20 bg-primary/5"
            >
              <span className="text-xl">{dailyInsight.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Insight do dia</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{dailyInsight.text}</p>
                <p className="text-[11px] font-semibold text-primary mt-1.5 inline-flex items-center gap-1">
                  {dailyInsight.cta} <Sparkles className="h-3 w-3" />
                </p>
              </div>
            </button>
          </motion.div>
        )}

        {/* Greeting (paid users only) */}
        {isPaid && (
          <motion.div variants={item} className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Bem-vindo(a) de volta</p>
            <h1 className="text-xl font-bold sm:text-2xl">{profile?.name || "Profissional"}</h1>
          </motion.div>
        )}

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

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        feature="Mentora Financeira IA"
        currentUsage={financialHealth.transactionCount}
        limit={financialHealth.transactionCount}
      />
    </PageContainer>
  );
};

export default Dashboard;
