import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DollarSign, Compass, Video, ExternalLink, Copy, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import PageSkeleton from "@/components/PageSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, profile_slug, referral_code, created_at")
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

  const { data: referralCount = 0 } = useQuery({
    queryKey: ["referral-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referral_code", user!.id);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const profileUrl = profile?.profile_slug
    ? `salbcare.com.br/p/${profile.profile_slug}`
    : null;

  const referralUrl = `salbcare.com.br/cadastro?ref=${user?.id}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(`https://${text}`);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const monthName = new Date().toLocaleDateString("pt-BR", { month: "long" });

  if (isLoading) return <PageContainer><PageSkeleton variant="dashboard" /></PageContainer>;

  return (
    <PageContainer>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {/* Greeting */}
        <motion.div variants={item} className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Bem-vindo(a) de volta</p>
          <h1 className="text-xl font-bold sm:text-2xl">{profile?.name || "Profissional"}</h1>
        </motion.div>

        {/* Card 1 — Financeiro */}
        <motion.div variants={item}>
          <button
            onClick={() => navigate("/dashboard/financeiro")}
            className="glass-card w-full p-5 text-left transition-all active:scale-[0.98] hover:border-primary/50 ring-1 ring-primary/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Financeiro</p>
                <p className="text-xs text-muted-foreground">
                  R$ {monthlyIncome.toLocaleString("pt-BR")} recebido em {monthName}
                </p>
              </div>
            </div>
            <span className="text-xs text-primary font-medium">Abrir →</span>
          </button>
        </motion.div>

        {/* Card 2 — Mentoria */}
        <motion.div variants={item}>
          <button
            onClick={() => navigate("/dashboard/mentoria")}
            className="glass-card w-full p-5 text-left transition-all active:scale-[0.98] hover:border-primary/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                <Compass className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Mentoria</p>
                <p className="text-xs text-muted-foreground">Veja o diagnóstico do seu mês</p>
              </div>
            </div>
            <span className="text-xs text-primary font-medium">Abrir →</span>
          </button>
        </motion.div>

        {/* Card 3 — Teleconsulta */}
        <motion.div variants={item}>
          <button
            onClick={() => navigate("/dashboard/teleconsulta")}
            className="glass-card w-full p-5 text-left transition-all active:scale-[0.98] hover:border-primary/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                <Video className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Teleconsulta</p>
                <p className="text-xs text-muted-foreground">Seu link de atendimento</p>
              </div>
            </div>
            <span className="text-xs text-primary font-medium">Abrir →</span>
          </button>
        </motion.div>

        {/* Card 4 — Perfil público */}
        <motion.div variants={item}>
          <div className="glass-card p-4 space-y-3 border-border/60">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Meu perfil público</p>
            </div>
            {profileUrl && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground truncate flex-1">{profileUrl}</span>
                <button
                  onClick={() => handleCopy(profileUrl)}
                  className="shrink-0 flex items-center gap-1 text-xs text-primary font-medium"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            )}
            <div className="border-t border-border/40 pt-3 space-y-2">
              <p className="text-xs text-muted-foreground">Indique um colega</p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground truncate flex-1">{referralUrl}</span>
                <button
                  onClick={() => handleCopy(referralUrl)}
                  className="shrink-0 flex items-center gap-1 text-xs text-primary font-medium"
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {referralCount} {referralCount === 1 ? "colega indicado" : "colegas indicados"} • Cada indicação ajuda a SalbCare a crescer 🙌
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
};

export default Dashboard;
