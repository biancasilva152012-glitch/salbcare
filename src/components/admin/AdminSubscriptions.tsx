import { useMemo, useState } from "react";
import { useAdminUsers, AdminUser } from "@/hooks/useAdminData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Download, Loader2, TrendingUp, Users as UsersIcon, CreditCard, AlertCircle } from "lucide-react";
import { formatBRL } from "@/utils/currencyMask";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "Pagante", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  trialing: { label: "Em trial", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  past_due: { label: "Atrasado", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  canceled: { label: "Cancelado", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  none: { label: "Sem adesão", color: "bg-white/5 text-white/40 border-white/10" },
};

function getStatus(u: AdminUser): string {
  if (u.stripe?.subscription) return u.stripe.subscription.status;
  if (u.payment_status === "active") return "active";
  return "none";
}

function fmtDate(ts: string | number | null): string {
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const AdminSubscriptions = () => {
  const { data: users = [], isLoading } = useAdminUsers();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paying" | "trial" | "canceled" | "none">("all");

  const subs = useMemo(() => {
    return users
      .filter((u) => u.user_type === "professional")
      .filter(
        (u) =>
          !u.name?.toLowerCase().includes("teste") &&
          !u.email?.toLowerCase().includes("test"),
      );
  }, [users]);

  const stats = useMemo(() => {
    const paying = subs.filter((u) => getStatus(u) === "active").length;
    const trial = subs.filter((u) => getStatus(u) === "trialing").length;
    const canceled = subs.filter((u) => getStatus(u) === "canceled").length;
    const mrr = subs.reduce((acc, u) => {
      if (getStatus(u) === "active" && u.stripe?.subscription) {
        return acc + (u.stripe.subscription.plan_amount || 0) / 100;
      }
      return acc;
    }, 0);
    return { paying, trial, canceled, mrr, total: subs.length };
  }, [subs]);

  const filtered = useMemo(() => {
    let list = subs;
    if (filter === "paying") list = list.filter((u) => getStatus(u) === "active");
    if (filter === "trial") list = list.filter((u) => getStatus(u) === "trialing");
    if (filter === "canceled") list = list.filter((u) => getStatus(u) === "canceled");
    if (filter === "none") list = list.filter((u) => getStatus(u) === "none");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
      );
    }
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [subs, filter, search]);

  const exportCSV = () => {
    const rows = [
      ["Nome", "Email", "Telefone", "Status", "Plano (R$/mês)", "Data Cadastro", "Próx. Renovação"],
      ...filtered.map((u) => [
        u.name,
        u.email,
        u.phone || "",
        STATUS_MAP[getStatus(u)]?.label || "—",
        u.stripe?.subscription ? ((u.stripe.subscription.plan_amount || 0) / 100).toFixed(2) : "0",
        fmtDate(u.created_at),
        u.stripe?.subscription?.current_period_end ? fmtDate(u.stripe.subscription.current_period_end) : "—",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `adesoes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const kpis = [
    { label: "MRR", value: `R$ ${formatBRL(stats.mrr)}`, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Pagantes", value: stats.paying, icon: CreditCard, color: "text-blue-400" },
    { label: "Em trial", value: stats.trial, icon: UsersIcon, color: "text-amber-400" },
    { label: "Cancelados", value: stats.canceled, icon: AlertCircle, color: "text-red-400" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Adesões</h2>
        <p className="text-xs text-white/40 mt-0.5">Acompanhe quem assinou, quando e o status do pagamento</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-white/40">{k.label}</span>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </div>
            <p className="text-xl font-bold text-white mt-2">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border-white/10 pl-9 text-white placeholder:text-white/30 h-9 text-sm"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white/70 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({stats.total})</SelectItem>
            <SelectItem value="paying">Pagantes ({stats.paying})</SelectItem>
            <SelectItem value="trial">Em trial ({stats.trial})</SelectItem>
            <SelectItem value="canceled">Cancelados ({stats.canceled})</SelectItem>
            <SelectItem value="none">Sem adesão</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs border-white/10 text-white/60 hover:bg-white/5"
          onClick={exportCSV}
        >
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-white/50 text-xs">Profissional</TableHead>
                  <TableHead className="text-white/50 text-xs">Status</TableHead>
                  <TableHead className="text-white/50 text-xs">Valor</TableHead>
                  <TableHead className="text-white/50 text-xs">Cadastro</TableHead>
                  <TableHead className="text-white/50 text-xs">Próx. Renovação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const s = getStatus(u);
                  const info = STATUS_MAP[s] || STATUS_MAP.none;
                  return (
                    <TableRow key={u.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                      <TableCell>
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        <p className="text-xs text-white/40">{u.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${info.color}`}>
                          {info.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.stripe?.subscription ? (
                          <span className="text-xs text-white/70">
                            R$ {formatBRL((u.stripe.subscription.plan_amount || 0) / 100)}
                            <span className="text-white/30">/mês</span>
                          </span>
                        ) : (
                          <span className="text-xs text-white/20">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-white/50">{fmtDate(u.created_at)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-white/50">
                          {u.stripe?.subscription?.current_period_end
                            ? fmtDate(u.stripe.subscription.current_period_end)
                            : "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-white/30 text-sm">
                      Nenhuma adesão encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptions;
