import { useAdminUsers, useAdminMRR } from "@/hooks/useAdminData";
import { Users, DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

const StatCard = ({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) => (
  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/40">{label}</span>
      <div className={`rounded-lg p-1.5 ${accent}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

const AdminOverview = () => {
  const { data: users = [], isLoading: loadingUsers } = useAdminUsers();
  const { data: mrr, isLoading: loadingMRR } = useAdminMRR();

  const professionals = users.filter(
    (u) =>
      u.user_type === "professional" &&
      !u.name?.toLowerCase().includes("test") &&
      !u.email?.toLowerCase().includes("test@")
  );
  const activeCount = professionals.filter(
    (u) => u.payment_status === "active" || u.stripe?.subscription?.status === "active"
  ).length;

  if (loadingUsers || loadingMRR) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Visão Geral</h2>
        <p className="text-xs text-white/40">Métricas da plataforma em tempo real</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Profissionais"
          value={professionals.length}
          icon={Users}
          accent="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="Assinantes Ativos"
          value={activeCount}
          icon={Users}
          accent="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          label="MRR"
          value={`R$ ${(mrr?.mrr || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          accent="bg-violet-500/15 text-violet-400"
        />
        <StatCard
          label="Churn Rate"
          value={`${mrr?.churn_rate || 0}%`}
          icon={mrr?.churn_rate > 5 ? TrendingDown : TrendingUp}
          accent={mrr?.churn_rate > 5 ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}
        />
      </div>

      {/* Recent charges */}
      {mrr?.recent_charges?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/70">Transações Recentes</h3>
          <div className="rounded-xl border border-white/5 divide-y divide-white/5">
            {mrr.recent_charges.slice(0, 5).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-white">{c.customer_email || "—"}</p>
                  <p className="text-xs text-white/30">
                    {new Date(c.created * 1000).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    R$ {c.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <span
                    className={`text-[10px] ${
                      c.status === "succeeded" ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {c.status === "succeeded" ? "Aprovado" : c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
