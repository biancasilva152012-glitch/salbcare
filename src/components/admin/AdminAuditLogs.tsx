import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  RefreshCw, Search, Download, Shield, Activity, AlertTriangle, Users,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

/* ── Admin Logs (from admin_logs table) ── */
function useAdminLogs() {
  return useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15_000, // near real-time
  });
}

/* ── Recent signups (profiles created) ── */
function useRecentSignups() {
  return useQuery({
    queryKey: ["admin-recent-signups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, name, email, professional_type, user_type, created_at, payment_status, plan")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30_000,
  });
}

/* ── Recent service requests ── */
function useRecentRequests() {
  return useQuery({
    queryKey: ["admin-recent-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, patient_name, service_type, status, payment_status, created_at, professional_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30_000,
  });
}

const actionLabels: Record<string, string> = {
  suspend_user: "Suspendeu usuário",
  activate_user: "Ativou usuário",
  change_plan: "Alterou plano",
  refund_charge: "Reembolsou cobrança",
  list_users: "Listou usuários",
  get_mrr: "Consultou MRR",
};

const actionColors: Record<string, string> = {
  suspend_user: "border-red-500/30 text-red-400 bg-red-500/10",
  activate_user: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  change_plan: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  refund_charge: "border-amber-500/30 text-amber-400 bg-amber-500/10",
};

const AdminAuditLogs = () => {
  const [tab, setTab] = useState("admin");
  const [search, setSearch] = useState("");

  const adminLogs = useAdminLogs();
  const signups = useRecentSignups();
  const requests = useRecentRequests();

  const refetchAll = () => {
    adminLogs.refetch();
    signups.refetch();
    requests.refetch();
  };
  const isFetching = adminLogs.isFetching || signups.isFetching || requests.isFetching;

  const exportCSV = (rows: Record<string, any>[], cols: string[], filename: string) => {
    const csv = [cols.join(","), ...rows.map((r) =>
      cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(",")
    )].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (d: string) => {
    try { return format(new Date(d), "dd/MM/yy HH:mm"); } catch { return d; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Logs e Auditoria</h1>
          <p className="text-sm text-white/40">Monitoramento em tempo real</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetchAll}
          disabled={isFetching}
          className="border-white/10 text-white/60 hover:bg-white/5"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[hsl(220,20%,10%)] border-white/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Ações Admin</p>
              <p className="text-xl font-bold text-white">{adminLogs.data?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(220,20%,10%)] border-white/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Cadastros Recentes</p>
              <p className="text-xl font-bold text-white">{signups.data?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(220,20%,10%)] border-white/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Solicitações</p>
              <p className="text-xl font-bold text-white">{requests.data?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setSearch(""); }}>
        <TabsList className="bg-white/5 border border-white/10 h-auto gap-1 p-1">
          <TabsTrigger value="admin" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white/50 gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Ações Admin
          </TabsTrigger>
          <TabsTrigger value="signups" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white/50 gap-1.5">
            <Users className="h-3.5 w-3.5" /> Cadastros
          </TabsTrigger>
          <TabsTrigger value="requests" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white/50 gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Solicitações
          </TabsTrigger>
        </TabsList>

        {/* Admin Actions */}
        <TabsContent value="admin" className="mt-4">
          <Card className="bg-[hsl(220,20%,10%)] border-white/5">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-sm font-medium text-white/60">Histórico de Ações Administrativas</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                    <Input
                      placeholder="Buscar ação..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30 w-44"
                    />
                  </div>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => exportCSV(adminLogs.data || [], ["created_at", "action", "target_id", "target_table"], "admin_logs")}
                    className="h-8 text-xs border-white/10 text-white/60 hover:bg-white/5"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {adminLogs.isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/40 text-xs">Data</TableHead>
                        <TableHead className="text-white/40 text-xs">Ação</TableHead>
                        <TableHead className="text-white/40 text-xs">Tabela</TableHead>
                        <TableHead className="text-white/40 text-xs">Alvo</TableHead>
                        <TableHead className="text-white/40 text-xs">Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(adminLogs.data || [])
                        .filter((l) => !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.target_table?.toLowerCase().includes(search.toLowerCase()))
                        .map((log) => (
                          <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02]">
                            <TableCell className="text-white/70 text-xs whitespace-nowrap">{fmt(log.created_at)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${actionColors[log.action] || "border-white/20 text-white/50"}`}>
                                {actionLabels[log.action] || log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white/50 text-xs">{log.target_table || "—"}</TableCell>
                            <TableCell className="text-white/50 text-xs font-mono truncate max-w-[120px]">{log.target_id || "—"}</TableCell>
                            <TableCell className="text-white/40 text-xs truncate max-w-[200px]">
                              {log.details ? JSON.stringify(log.details).slice(0, 80) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      {(adminLogs.data || []).length === 0 && (
                        <TableRow className="border-white/5">
                          <TableCell colSpan={5} className="text-center text-white/30 py-8 text-sm">
                            Nenhuma ação registrada ainda
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signups */}
        <TabsContent value="signups" className="mt-4">
          <Card className="bg-[hsl(220,20%,10%)] border-white/5">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-sm font-medium text-white/60">Cadastros Recentes</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                  <Input
                    placeholder="Buscar nome, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30 w-48"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {signups.isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/40 text-xs">Data</TableHead>
                        <TableHead className="text-white/40 text-xs">Nome</TableHead>
                        <TableHead className="text-white/40 text-xs">Email</TableHead>
                        <TableHead className="text-white/40 text-xs">Tipo</TableHead>
                        <TableHead className="text-white/40 text-xs">Plano</TableHead>
                        <TableHead className="text-white/40 text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(signups.data || [])
                        .filter((s) => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()))
                        .map((s) => (
                          <TableRow key={s.id} className="border-white/5 hover:bg-white/[0.02]">
                            <TableCell className="text-white/70 text-xs whitespace-nowrap">{fmt(s.created_at)}</TableCell>
                            <TableCell className="text-white/80 text-xs font-medium">{s.name}</TableCell>
                            <TableCell className="text-white/60 text-xs">{s.email}</TableCell>
                            <TableCell className="text-white/50 text-xs">{s.professional_type}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 bg-blue-500/10">
                                {s.plan}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${
                                s.payment_status === "active" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                                s.payment_status === "trial" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                                "border-white/20 text-white/40"
                              }`}>
                                {s.payment_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Requests */}
        <TabsContent value="requests" className="mt-4">
          <Card className="bg-[hsl(220,20%,10%)] border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Solicitações de Serviço</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {requests.isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/40 text-xs">Data</TableHead>
                        <TableHead className="text-white/40 text-xs">Paciente</TableHead>
                        <TableHead className="text-white/40 text-xs">Serviço</TableHead>
                        <TableHead className="text-white/40 text-xs">Status</TableHead>
                        <TableHead className="text-white/40 text-xs">Pagamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(requests.data || []).map((r) => (
                        <TableRow key={r.id} className="border-white/5 hover:bg-white/[0.02]">
                          <TableCell className="text-white/70 text-xs whitespace-nowrap">{fmt(r.created_at)}</TableCell>
                          <TableCell className="text-white/80 text-xs">{r.patient_name || "—"}</TableCell>
                          <TableCell className="text-white/60 text-xs">{r.service_type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${
                              r.status === "completed" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                              r.status === "pending_payment" ? "border-amber-500/30 text-amber-400 bg-amber-500/10" :
                              "border-white/20 text-white/40"
                            }`}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${
                              r.payment_status === "paid" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                              "border-white/20 text-white/40"
                            }`}>
                              {r.payment_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(requests.data || []).length === 0 && (
                        <TableRow className="border-white/5">
                          <TableCell colSpan={5} className="text-center text-white/30 py-8 text-sm">
                            Nenhuma solicitação
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAuditLogs;
