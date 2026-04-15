import { useState, useMemo } from "react";
import { useAdminUsers, useAdminMRR, useSuspendUser, useActivateUser, useChangePlan } from "@/hooks/useAdminData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, DollarSign, TrendingUp, TrendingDown, Loader2, Ban, CheckCircle, UserCheck,
  Clock, ArrowUpRight, Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ConfirmAction {
  type: "suspend" | "activate" | "upgrade" | "downgrade";
  userId: string;
  userName: string;
}

const StatCard = ({
  label, value, change, icon: Icon, accent, bgAccent,
}: {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  accent: string;
  bgAccent: string;
}) => (
  <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-5 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</span>
      <div className={`rounded-xl p-2 ${bgAccent}`}>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
    </div>
    <div>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      {change && (
        <span className="text-[11px] text-emerald-400 flex items-center gap-0.5 mt-1">
          <ArrowUpRight className="h-3 w-3" /> {change}
        </span>
      )}
    </div>
  </div>
);

const AdminOverview = () => {
  const { data: users = [], isLoading: loadingUsers } = useAdminUsers();
  const { data: mrr, isLoading: loadingMRR } = useAdminMRR();
  const suspendUser = useSuspendUser();
  const activateUser = useActivateUser();
  const changePlan = useChangePlan();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [chartWeeks, setChartWeeks] = useState(12);
  const [chartType, setChartType] = useState("all");

  const { data: recentSignups = [] } = useQuery({
    queryKey: ["admin-recent-signups-overview"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, name, email, professional_type, created_at, payment_status, plan")
        .eq("user_type", "professional")
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
    refetchInterval: 15_000,
  });

  // Weekly signups for chart (last 12 weeks)
  const weeklyData = useMemo(() => {
    if (!users.length) return [];
    const now = new Date();
    const weeks: { label: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7 - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const count = users.filter((u) => {
        if (u.user_type !== "professional") return false;
        const d = new Date(u.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      const label = `${weekStart.getDate().toString().padStart(2, "0")}/${(weekStart.getMonth() + 1).toString().padStart(2, "0")}`;
      weeks.push({ label, count });
    }
    return weeks;
  }, [users]);

  const professionals = users.filter(
    (u) =>
      u.user_type === "professional" &&
      !u.name?.toLowerCase().includes("test") &&
      !u.email?.toLowerCase().includes("test@")
  );
  const activeCount = professionals.filter(
    (u) => u.payment_status === "active" || u.stripe?.subscription?.status === "active"
  ).length;

  const handleConfirm = () => {
    if (!confirmAction) return;
    switch (confirmAction.type) {
      case "suspend":
        suspendUser.mutate(confirmAction.userId);
        break;
      case "activate":
        activateUser.mutate(confirmAction.userId);
        break;
      case "upgrade":
        changePlan.mutate({ user_id: confirmAction.userId, plan: "essential" });
        break;
      case "downgrade":
        changePlan.mutate({ user_id: confirmAction.userId, plan: "basic" });
        break;
    }
    setConfirmAction(null);
  };

  const confirmLabels: Record<string, { title: string; desc: string; action: string; variant: string }> = {
    suspend: { title: "Suspender usuário", desc: "será suspenso e perderá acesso à plataforma.", action: "Suspender", variant: "destructive" },
    activate: { title: "Reativar usuário", desc: "será reativado e terá acesso restaurado.", action: "Reativar", variant: "default" },
    upgrade: { title: "Upgrade para Essential", desc: "será atualizado para o plano Essential.", action: "Confirmar Upgrade", variant: "default" },
    downgrade: { title: "Rebaixar para Basic", desc: "será rebaixado para o plano Basic.", action: "Confirmar", variant: "destructive" },
  };

  if (loadingUsers || loadingMRR) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";

  const typeLabels: Record<string, string> = {
    medico: "Médico", dentista: "Dentista", psicologo: "Psicólogo",
    nutricionista: "Nutricionista", fisioterapeuta: "Fisioterapeuta", outro: "Outro",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{greeting}, Admin 👋</h1>
        <p className="text-sm text-white/40 mt-1">
          {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Profissionais"
          value={professionals.length}
          icon={Users}
          accent="text-blue-400"
          bgAccent="bg-blue-500/10"
        />
        <StatCard
          label="Assinantes Ativos"
          value={activeCount}
          icon={Users}
          accent="text-emerald-400"
          bgAccent="bg-emerald-500/10"
        />
        <StatCard
          label="MRR"
          value={`R$ ${(mrr?.mrr || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          accent="text-violet-400"
          bgAccent="bg-violet-500/10"
        />
        <StatCard
          label="Churn Rate"
          value={`${mrr?.churn_rate || 0}%`}
          icon={mrr?.churn_rate && mrr.churn_rate > 5 ? TrendingDown : TrendingUp}
          accent={mrr?.churn_rate && mrr.churn_rate > 5 ? "text-red-400" : "text-emerald-400"}
          bgAccent={mrr?.churn_rate && mrr.churn_rate > 5 ? "bg-red-500/10" : "bg-emerald-500/10"}
        />
      </div>

      {/* Weekly Signups Chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-400" />
          Evolução de Cadastros (últimas 12 semanas)
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220,20%,12%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 12,
                }}
                labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                formatter={(value: number) => [`${value} cadastros`, "Semana"]}
              />
              <Bar dataKey="count" fill="hsl(217,91%,60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent signups with quick actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              Cadastros Recentes
            </h3>
            <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-400 bg-blue-500/10 animate-pulse">
              LIVE
            </Badge>
          </div>
          <div className="rounded-2xl border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
            {recentSignups.length === 0 ? (
              <div className="p-8 text-center text-white/30 text-sm">Nenhum cadastro recente</div>
            ) : (
              recentSignups.map((s: any) => (
                <div key={s.user_id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{s.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-white/40 truncate">{s.email}</span>
                      <span className="text-[10px] text-white/25">•</span>
                      <span className="text-[11px] text-white/40">{typeLabels[s.professional_type] || s.professional_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        s.payment_status === "active"
                          ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10"
                          : s.payment_status === "suspended"
                          ? "border-red-500/20 text-red-400 bg-red-500/10"
                          : "border-white/10 text-white/40"
                      }`}
                    >
                      {s.payment_status === "active" ? "Ativo" : s.payment_status === "suspended" ? "Suspenso" : s.payment_status}
                    </Badge>
                    {s.payment_status !== "suspended" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-white/20 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => setConfirmAction({ type: "suspend", userId: s.user_id, userName: s.name })}
                        title="Suspender"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => setConfirmAction({ type: "activate", userId: s.user_id, userName: s.name })}
                        title="Reativar"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-white/20 hover:text-blue-400 hover:bg-blue-500/10"
                      onClick={() =>
                        setConfirmAction({
                          type: s.plan === "essential" ? "downgrade" : "upgrade",
                          userId: s.user_id,
                          userName: s.name,
                        })
                      }
                      title={s.plan === "essential" ? "Rebaixar" : "Upgrade"}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-violet-400" />
            Transações Recentes
          </h3>
          <div className="rounded-2xl border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
            {!mrr?.recent_charges?.length ? (
              <div className="p-8 text-center text-white/30 text-sm">Nenhuma transação</div>
            ) : (
              mrr.recent_charges.slice(0, 8).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{c.customer_email || "—"}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3 text-white/20" />
                      <span className="text-[11px] text-white/30">
                        {new Date(c.created * 1000).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-sm font-semibold text-white">
                      R$ {c.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span
                      className={`text-[10px] ${
                        c.refunded ? "text-amber-400" : c.status === "succeeded" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {c.refunded ? "Reembolsado" : c.status === "succeeded" ? "Aprovado" : c.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="bg-[hsl(220,20%,10%)] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmAction && confirmLabels[confirmAction.type]?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              <span className="font-medium text-white">{confirmAction?.userName}</span>{" "}
              {confirmAction && confirmLabels[confirmAction.type]?.desc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/60 hover:bg-white/5 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                confirmAction?.type === "suspend" || confirmAction?.type === "downgrade"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }
            >
              {confirmAction && confirmLabels[confirmAction.type]?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminOverview;
