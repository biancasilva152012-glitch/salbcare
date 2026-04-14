import { useState, useMemo } from "react";
import { useAdminUsers, useSuspendUser, useActivateUser, useChangePlan, AdminUser } from "@/hooks/useAdminData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, MoreHorizontal, Ban, CheckCircle, ArrowUpDown, Download, Loader2, UserCheck } from "lucide-react";
import { formatBRL } from "@/utils/currencyMask";

const TYPE_LABELS: Record<string, string> = {
  medico: "Médico",
  dentista: "Dentista",
  psicologo: "Psicólogo",
  nutricionista: "Nutricionista",
  fisioterapeuta: "Fisioterapeuta",
  fonoaudiologo: "Fonoaudiólogo",
  terapeuta_ocupacional: "Terapeuta Ocupacional",
  educador_fisico: "Educador Físico",
  outro: "Outro",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  trialing: { label: "Trial", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  past_due: { label: "Inadimplente", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  canceled: { label: "Cancelado", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  suspended: { label: "Suspenso", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  none: { label: "Sem assinatura", color: "bg-white/5 text-white/40 border-white/10" },
  pending_approval: { label: "Aguardando", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
};

function getEffectiveStatus(user: AdminUser): string {
  if (user.payment_status === "suspended") return "suspended";
  if (user.stripe?.subscription) return user.stripe.subscription.status;
  if (user.payment_status === "active") return "active";
  if (user.payment_status === "pending_approval") return "pending_approval";
  return "none";
}

function formatDate(ts: string | number | null): string {
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const AdminUsersTable = () => {
  const { data: users = [], isLoading } = useAdminUsers();
  const suspendUser = useSuspendUser();
  const activateUser = useActivateUser();
  const changePlan = useChangePlan();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "status">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let list = users.filter((u) => u.user_type === "professional");

    // Filter out test accounts
    list = list.filter(
      (u) =>
        !u.name?.toLowerCase().includes("teste") &&
        !u.name?.toLowerCase().includes("test") &&
        !u.email?.toLowerCase().includes("teste@") &&
        !u.email?.toLowerCase().includes("test@")
    );

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((u) => getEffectiveStatus(u) === statusFilter);
    }

    if (typeFilter !== "all") {
      list = list.filter((u) => u.professional_type === typeFilter);
    }

    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "") * dir;
      if (sortBy === "status") return getEffectiveStatus(a).localeCompare(getEffectiveStatus(b)) * dir;
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    });

    return list;
  }, [users, search, statusFilter, typeFilter, sortBy, sortDir]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  };

  const exportCSV = () => {
    const rows = [
      ["Nome", "Email", "Telefone", "Tipo", "Plano", "Status", "Stripe Status", "Cadastro"],
      ...filtered.map((u) => [
        u.name,
        u.email,
        u.phone || "",
        TYPE_LABELS[u.professional_type] || u.professional_type,
        u.plan,
        getEffectiveStatus(u),
        u.stripe?.subscription?.status || "N/A",
        formatDate(u.created_at),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Gestão de Usuários</h2>
          <p className="text-xs text-white/40">{filtered.length} profissionais encontrados</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs border-white/10 text-white/60 hover:bg-white/5"
          onClick={exportCSV}
        >
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border-white/10 pl-9 text-white placeholder:text-white/30 h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white/70 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="trialing">Trial</SelectItem>
            <SelectItem value="past_due">Inadimplente</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
            <SelectItem value="suspended">Suspenso</SelectItem>
            <SelectItem value="none">Sem assinatura</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white/70 h-9 text-sm">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead
                    className="text-white/50 text-xs cursor-pointer hover:text-white/80"
                    onClick={() => toggleSort("name")}
                  >
                    <span className="flex items-center gap-1">
                      Profissional <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead className="text-white/50 text-xs">Tipo</TableHead>
                  <TableHead
                    className="text-white/50 text-xs cursor-pointer hover:text-white/80"
                    onClick={() => toggleSort("status")}
                  >
                    <span className="flex items-center gap-1">
                      Status <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead className="text-white/50 text-xs">Stripe</TableHead>
                  <TableHead className="text-white/50 text-xs">Renovação</TableHead>
                  <TableHead
                    className="text-white/50 text-xs cursor-pointer hover:text-white/80"
                    onClick={() => toggleSort("created_at")}
                  >
                    <span className="flex items-center gap-1">
                      Cadastro <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead className="text-white/50 text-xs w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => {
                  const status = getEffectiveStatus(user);
                  const statusInfo = STATUS_MAP[status] || STATUS_MAP.none;

                  return (
                    <TableRow
                      key={user.id}
                      className="border-white/5 hover:bg-white/[0.02]"
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-white/40">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-white/60">
                          {TYPE_LABELS[user.professional_type] || user.professional_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.stripe?.subscription ? (
                          <span className="text-xs text-white/60">
                            R$ {formatBRL((user.stripe.subscription.plan_amount || 0) / 100)}
                            <span className="text-white/30">/mês</span>
                          </span>
                        ) : (
                          <span className="text-xs text-white/20">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-white/50">
                          {user.stripe?.subscription?.current_period_end
                            ? formatDate(user.stripe.subscription.current_period_end)
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-white/40">{formatDate(user.created_at)}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-white/30 hover:text-white hover:bg-white/10"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {status !== "suspended" ? (
                              <DropdownMenuItem
                                onClick={() => suspendUser.mutate(user.user_id)}
                                className="text-red-400 focus:text-red-400"
                              >
                                <Ban className="mr-2 h-3.5 w-3.5" /> Suspender
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => activateUser.mutate(user.user_id)}>
                                <CheckCircle className="mr-2 h-3.5 w-3.5" /> Reativar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                changePlan.mutate({
                                  user_id: user.user_id,
                                  plan: user.plan === "essential" ? "basic" : "essential",
                                })
                              }
                            >
                              <UserCheck className="mr-2 h-3.5 w-3.5" />
                              {user.plan === "essential" ? "Rebaixar p/ Basic" : "Upgrade p/ Essential"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-white/30 text-sm">
                      Nenhum profissional encontrado
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

export default AdminUsersTable;
