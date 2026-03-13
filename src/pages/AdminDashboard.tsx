import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Shield, CreditCard, Building2, Clock, Ban,
  CheckCircle, Eye, UserX, Users, ArrowLeft, Loader2, MessageCircle,
} from "lucide-react";
import { getTrialDaysRemaining } from "@/config/plans";

interface ProfileRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  plan: string;
  payment_status: string;
  trial_start_date: string | null;
  professional_type: string;
}

interface CnpjRow {
  id: string;
  user_id: string;
  name: string;
  cpf: string;
  city: string; // actually WhatsApp
  profession: string;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [cnpjRequests, setCnpjRequests] = useState<CnpjRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check admin role
  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.rpc("is_admin_or_contador", { _user_id: user.id });
      if (!data) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setIsAdmin(true);
    };
    checkAdmin();
  }, [user, navigate]);

  // Load data
  useEffect(() => {
    if (!isAdmin) return;
    const loadData = async () => {
      setLoadingData(true);
      const [profilesRes, cnpjRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("cnpj_requests").select("*").order("created_at", { ascending: false }),
      ]);
      setProfiles((profilesRes.data as ProfileRow[]) || []);
      setCnpjRequests((cnpjRes.data as CnpjRow[]) || []);
      setLoadingData(false);
    };
    loadData();
  }, [isAdmin]);

  const handleApprove = async (profile: ProfileRow) => {
    setActionLoading(profile.id);
    const { error } = await supabase
      .from("profiles")
      .update({ payment_status: "active" })
      .eq("user_id", profile.user_id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Assinatura de ${profile.name} aprovada!`);
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, payment_status: "active" } : p))
      );
    }
    setActionLoading(null);
  };

  const handleSuspend = async (profile: ProfileRow) => {
    setActionLoading(profile.id);
    const { error } = await supabase
      .from("profiles")
      .update({ payment_status: "suspended" })
      .eq("user_id", profile.user_id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Acesso de ${profile.name} suspenso.`);
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, payment_status: "suspended" } : p))
      );
    }
    setActionLoading(null);
  };

  const handleViewReceipt = async (profile: ProfileRow) => {
    const { data, error } = await supabase.storage
      .from("payment-receipts")
      .list(profile.user_id, { limit: 10, sortBy: { column: "created_at", order: "desc" } });

    if (error || !data || data.length === 0) {
      toast.error("Nenhum comprovante encontrado.");
      return;
    }

    const { data: urlData } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(`${profile.user_id}/${data[0].name}`, 300);

    if (urlData?.signedUrl) {
      window.open(urlData.signedUrl, "_blank");
    } else {
      toast.error("Erro ao gerar link do comprovante.");
    }
  };

  // Derived data
  const pendingPayments = profiles.filter((p) => p.payment_status === "pending_approval");
  const trialUsers = profiles.filter((p) => {
    if (!p.trial_start_date) return false;
    const days = getTrialDaysRemaining(p.trial_start_date);
    return days > 0 && p.payment_status !== "active";
  });
  const professionalUsers = profiles.filter((p) => p.plan === "professional" || p.plan === "clinic");

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      active: { label: "Ativo", className: "bg-success/10 text-success border-success/20" },
      pending_approval: { label: "Aguardando", className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
      suspended: { label: "Suspenso", className: "bg-destructive/10 text-destructive border-destructive/20" },
      none: { label: "Sem pagamento", className: "bg-muted text-muted-foreground border-border" },
      trial: { label: "Trial", className: "bg-primary/10 text-primary border-primary/20" },
    };
    const s = map[status] || map.none;
    return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao App
        </button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
            <p className="text-xs text-muted-foreground">Gestão de assinaturas, CNPJ e usuários</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{pendingPayments.length}</p>
            <p className="text-[10px] text-muted-foreground">PIX Pendentes</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{trialUsers.length}</p>
            <p className="text-[10px] text-muted-foreground">Em Trial</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{profiles.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Usuários</p>
          </div>
        </div>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-accent">
            <TabsTrigger value="payments" className="text-xs gap-1">
              <CreditCard className="h-3.5 w-3.5" /> PIX
            </TabsTrigger>
            <TabsTrigger value="cnpj" className="text-xs gap-1">
              <Building2 className="h-3.5 w-3.5" /> CNPJ
            </TabsTrigger>
            <TabsTrigger value="trials" className="text-xs gap-1">
              <Clock className="h-3.5 w-3.5" /> Trials
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs gap-1">
              <Users className="h-3.5 w-3.5" /> Todos
            </TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pagamentos PIX Aguardando Aprovação ({pendingPayments.length})
            </p>
            {loadingData ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : pendingPayments.length === 0 ? (
              <div className="glass-card p-6 text-center text-sm text-muted-foreground">
                Nenhum pagamento pendente
              </div>
            ) : (
              pendingPayments.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                    <Badge variant="outline" className="bg-accent text-xs capitalize">{p.plan}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      onClick={() => handleViewReceipt(p)}
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver Comprovante
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1 text-xs gradient-primary"
                      onClick={() => handleApprove(p)}
                      disabled={actionLoading === p.id}
                    >
                      {actionLoading === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      Aprovar
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* CNPJ Tab */}
          <TabsContent value="cnpj" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Solicitações de CNPJ — Plano Profissional ({cnpjRequests.length})
            </p>
            {loadingData ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : cnpjRequests.length === 0 ? (
              <div className="glass-card p-6 text-center text-sm text-muted-foreground">
                Nenhuma solicitação de CNPJ
              </div>
            ) : (
              cnpjRequests.map((r) => {
                const profile = profiles.find((p) => p.user_id === r.user_id);
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.profession}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          r.status === "completed"
                            ? "bg-success/10 text-success border-success/20"
                            : r.status === "in_progress"
                            ? "bg-blue-400/10 text-blue-400 border-blue-400/20"
                            : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                        }
                      >
                        {r.status === "completed" ? "Concluído" : r.status === "in_progress" ? "Em andamento" : "Em análise"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">CPF:</span> {r.cpf}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">WhatsApp:</span> {r.city}
                      </div>
                      {profile && (
                        <div className="col-span-2">
                          <span className="font-medium text-foreground">Email:</span> {profile.email}
                        </div>
                      )}
                    </div>
                    {r.city && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs mt-1"
                        asChild
                      >
                        <a
                          href={`https://wa.me/55${r.city.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${r.name}, sou do SalbCare e gostaria de falar sobre sua solicitação de CNPJ.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Chamar no WhatsApp
                        </a>
                      </Button>
                    )}
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* Trials Tab */}
          <TabsContent value="trials" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Usuários em Período de Teste ({trialUsers.length})
            </p>
            {loadingData ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : trialUsers.length === 0 ? (
              <div className="glass-card p-6 text-center text-sm text-muted-foreground">
                Nenhum usuário em trial
              </div>
            ) : (
              trialUsers.map((p) => {
                const daysLeft = getTrialDaysRemaining(p.trial_start_date);
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">Plano: {p.plan}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          daysLeft <= 2
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        }
                      >
                        {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-destructive mt-1 gap-1"
                        onClick={() => handleSuspend(p)}
                        disabled={actionLoading === p.id}
                      >
                        <Ban className="h-3 w-3" /> Suspender
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* All Users Tab */}
          <TabsContent value="users" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Todos os Usuários ({profiles.length})
            </p>
            {loadingData ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              profiles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {p.professional_type} • {p.plan}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 ml-2">
                    {getStatusBadge(p.payment_status)}
                    {p.payment_status !== "suspended" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[10px] text-destructive h-6 px-2 gap-1"
                        onClick={() => handleSuspend(p)}
                        disabled={actionLoading === p.id}
                      >
                        <UserX className="h-3 w-3" /> Suspender
                      </Button>
                    )}
                    {p.payment_status === "suspended" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[10px] text-success h-6 px-2 gap-1"
                        onClick={() => handleApprove(p)}
                        disabled={actionLoading === p.id}
                      >
                        <CheckCircle className="h-3 w-3" /> Reativar
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
