import { useState } from "react";
import { useAdminMRR, useRefundCharge } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DollarSign, TrendingUp, TrendingDown, Users, RefreshCw, Download, Search, Undo2,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminFinanceDashboard = () => {
  const { data, isLoading, refetch, isFetching } = useAdminMRR();
  const refundMutation = useRefundCharge();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const mrr = data?.mrr ?? 0;
  const activeSubs = data?.active_subs ?? 0;
  const churnRate = data?.churn_rate ?? 0;
  const totalCanceled = data?.total_canceled ?? 0;
  const charges = data?.recent_charges ?? [];
  const monthlyRevenue = data?.monthly_revenue ?? [];

  const filtered = charges.filter(
    (c) =>
      !search ||
      c.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const rows = [
      ["ID", "Email", "Valor", "Status", "Reembolsado", "Data"],
      ...filtered.map((c) => [
        c.id,
        c.customer_email || "",
        c.amount.toString(),
        c.status,
        c.refunded ? "Sim" : "Não",
        new Date(c.created * 1000).toLocaleDateString("pt-BR"),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Painel Financeiro</h1>
          <p className="text-sm text-white/40">Dados em tempo real do Stripe</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-white/10 text-white/60 hover:bg-white/5"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[hsl(220,20%,10%)] border-white/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">MRR</p>
                <p className="text-2xl font-bold text-white mt-1">{formatBRL(mrr)}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(220,20%,10%)] border-white/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Assinaturas Ativas</p>
                <p className="text-2xl font-bold text-white mt-1">{activeSubs}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(220,20%,10%)] border-white/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Taxa de Churn</p>
                <p className="text-2xl font-bold text-white mt-1">{churnRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(220,20%,10%)] border-white/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Cancelamentos</p>
                <p className="text-2xl font-bold text-white mt-1">{totalCanceled}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      {monthlyRevenue.length > 0 && (
        <Card className="bg-[hsl(220,20%,10%)] border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Receita Mensal (últimos 6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(220,20%,12%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#fff",
                    }}
                    formatter={(value: number) => [formatBRL(value), "Receita"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(217,91%,60%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card className="bg-[hsl(220,20%,10%)] border-white/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium text-white/60">
              Histórico de Transações
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                <Input
                  placeholder="Buscar email, ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30 w-48"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="h-8 text-xs border-white/10 text-white/60 hover:bg-white/5"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-white/40 text-xs">Data</TableHead>
                  <TableHead className="text-white/40 text-xs">Email</TableHead>
                  <TableHead className="text-white/40 text-xs">Valor</TableHead>
                  <TableHead className="text-white/40 text-xs">Status</TableHead>
                  <TableHead className="text-white/40 text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={5} className="text-center text-white/30 py-8 text-sm">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="text-white/70 text-xs">
                        {new Date(c.created * 1000).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-white/70 text-xs">
                        {c.customer_email || "—"}
                      </TableCell>
                      <TableCell className="text-white font-medium text-xs">
                        {formatBRL(c.amount)}
                      </TableCell>
                      <TableCell>
                        {c.refunded ? (
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10">
                            Reembolsado
                          </Badge>
                        ) : c.paid ? (
                          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                            Pago
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400 bg-red-500/10">
                            Falhou
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.paid && !c.refunded && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-white/40 hover:text-amber-400 hover:bg-amber-500/10"
                            onClick={() => {
                              if (confirm(`Reembolsar ${formatBRL(c.amount)} para ${c.customer_email}?`)) {
                                refundMutation.mutate(c.id);
                              }
                            }}
                            disabled={refundMutation.isPending}
                          >
                            <Undo2 className="h-3.5 w-3.5 mr-1" />
                            Reembolsar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFinanceDashboard;
