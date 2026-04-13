import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/config/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Shield, Users, Loader2, Search, ArrowLeft, Stethoscope,
  DollarSign, BarChart3, UserPlus, TrendingUp,
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: "Ativo", cls: "bg-green-500/10 text-green-600 border-green-500/20" },
  trialing: { label: "Trial", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  canceled: { label: "Cancelado", cls: "bg-red-500/10 text-red-600 border-red-500/20" },
  none: { label: "Sem plano", cls: "bg-muted text-muted-foreground border-border" },
};

const CeoDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchPro, setSearchPro] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    if (!isAdminEmail(user.email)) { navigate("/dashboard", { replace: true }); return; }
    setAuthorized(true);
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authorized) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setProfiles(data || []);
      setLoading(false);
    };
    load();
  }, [authorized]);

  const professionals = useMemo(() => profiles.filter(p => p.user_type === "professional" && !p.name?.toLowerCase().includes("teste") && !p.name?.toLowerCase().includes("test") && !p.email?.toLowerCase().includes("teste@") && !p.email?.toLowerCase().includes("test@")), [profiles]);
  const totalPros = professionals.length;
  const activePros = professionals.filter(p => p.payment_status === "active").length;
  const trialPros = professionals.filter(p => {
    if (!p.trial_start_date) return false;
    const days = Math.ceil((7 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(p.trial_start_date).getTime())) / (1000 * 60 * 60 * 24));
    return days > 0 && p.payment_status !== "active";
  }).length;
  const churnThisMonth = professionals.filter(p => {
    if (p.payment_status !== "canceled" && p.payment_status !== "expired") return false;
    const d = new Date(p.updated_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const estimatedMRR = activePros * 89;

  const latestRegistrations = professionals.slice(0, 10);

  const filteredPros = useMemo(() => {
    return professionals.filter(p => {
      const matchSearch = !searchPro || p.name?.toLowerCase().includes(searchPro.toLowerCase()) || p.email?.toLowerCase().includes(searchPro.toLowerCase());
      const matchStatus = filterStatus === "all" || p.payment_status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [professionals, searchPro, filterStatus]);

  // Monthly registrations chart data (last 6 months)
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    for (const p of professionals) {
      const month = format(new Date(p.created_at), "MMM/yy", { locale: ptBR });
      months[month] = (months[month] || 0) + 1;
    }
    return Object.entries(months).slice(-6).map(([name, value]) => ({ name, value }));
  }, [professionals]);

  // Referral data
  const referralData = useMemo(() => {
    const refs: Record<string, { name: string; count: number; lastDate: string }> = {};
    for (const p of professionals) {
      if (p.referral_code) {
        if (!refs[p.referral_code]) {
          const referrer = professionals.find(r => r.user_id === p.referral_code);
          refs[p.referral_code] = {
            name: referrer?.name || p.referral_code,
            count: 0,
            lastDate: p.created_at,
          };
        }
        refs[p.referral_code].count++;
        if (p.created_at > refs[p.referral_code].lastDate) {
          refs[p.referral_code].lastDate = p.created_at;
        }
      }
    }
    return Object.values(refs).sort((a, b) => b.count - a.count);
  }, [professionals]);

  const totalByReferral = referralData.reduce((sum, r) => sum + r.count, 0);

  const getStatusBadge = (status: string) => {
    const s = STATUS_MAP[status] || STATUS_MAP.none;
    return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
  };

  if (authLoading || authorized === null || loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SalbCare Admin</h1>
              <p className="text-xs text-muted-foreground">{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">{totalPros} profissionais</Badge>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex w-full bg-accent gap-1 h-auto p-1 flex-wrap">
            <TabsTrigger value="overview" className="text-xs gap-1 flex-1 min-w-fit"><BarChart3 className="h-3.5 w-3.5" />Visão Geral</TabsTrigger>
            <TabsTrigger value="professionals" className="text-xs gap-1 flex-1 min-w-fit"><Stethoscope className="h-3.5 w-3.5" />Profissionais</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs gap-1 flex-1 min-w-fit"><DollarSign className="h-3.5 w-3.5" />Financeiro</TabsTrigger>
            <TabsTrigger value="referrals" className="text-xs gap-1 flex-1 min-w-fit"><UserPlus className="h-3.5 w-3.5" />Indicações</TabsTrigger>
          </TabsList>

          {/* Tab 1 — Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total cadastradas", value: totalPros, icon: Stethoscope },
                { label: "Plano ativo", value: activePros, icon: Users },
                { label: "Em trial", value: trialPros, icon: TrendingUp },
                { label: "Churn do mês", value: churnThisMonth, icon: Users },
              ].map((kpi) => (
                <div key={kpi.label} className="glass-card p-4 text-center">
                  <kpi.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                </div>
              ))}
            </div>

            <div className="glass-card p-4">
              <p className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Últimos cadastros</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Especialidade</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {latestRegistrations.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-medium">{p.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.professional_type}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{getStatusBadge(p.payment_status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2 — Profissionais */}
          <TabsContent value="professionals" className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar por nome ou e-mail..." value={searchPro} onChange={e => setSearchPro(e.target.value)} className="pl-8 text-xs h-8" />
              </div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="h-8 text-xs rounded-md border border-input bg-background px-2"
              >
                <option value="all">Todos</option>
                <option value="active">Ativo</option>
                <option value="trialing">Trial</option>
                <option value="canceled">Cancelado</option>
                <option value="none">Sem plano</option>
              </select>
            </div>
            <div className="overflow-x-auto glass-card p-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Especialidade</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Indicação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPros.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs font-medium">{p.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.email}</TableCell>
                      <TableCell className="text-xs">{p.professional_type}</TableCell>
                      <TableCell>{getStatusBadge(p.payment_status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.referral_code || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tab 3 — Financeiro */}
          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-primary">R$ {estimatedMRR}</p>
                <p className="text-[10px] text-muted-foreground">MRR atual</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold">{activePros}</p>
                <p className="text-[10px] text-muted-foreground">Assinantes ativos</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold">{Math.round(estimatedMRR / 30 * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())}</p>
                <p className="text-[10px] text-muted-foreground">Projeção do mês</p>
              </div>
            </div>

            <div className="glass-card p-4">
              <p className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Novos assinantes por mês</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Tab 4 — Indicações */}
          <TabsContent value="referrals" className="space-y-4">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalByReferral}</p>
              <p className="text-xs text-muted-foreground">profissionais vieram por indicação</p>
            </div>
            <div className="overflow-x-auto glass-card p-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Quem indicou</TableHead>
                    <TableHead className="text-xs">Indicações</TableHead>
                    <TableHead className="text-xs">Última indicação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-xs text-center text-muted-foreground py-8">
                        Nenhuma indicação registrada ainda
                      </TableCell>
                    </TableRow>
                  )}
                  {referralData.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell className="text-xs font-medium">{r.name}</TableCell>
                      <TableCell className="text-xs">{r.count}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.lastDate).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CeoDashboard;
