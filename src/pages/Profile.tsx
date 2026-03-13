import { LogOut, User, CreditCard, ChevronRight, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { PLANS } from "@/config/plans";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const professionalTypeLabels: Record<string, string> = {
  medico: "Médico(a)",
  dentista: "Dentista",
  psicologo: "Psicólogo(a)",
  fisioterapeuta: "Fisioterapeuta",
  nutricionista: "Nutricionista",
  outro: "Outro",
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, subscription } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const getStatusBadge = () => {
    const { paymentStatus, trialDaysRemaining, subscribed } = subscription;

    if (paymentStatus === "active" || subscribed) {
      return (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-success/10 text-success">
          <CheckCircle className="h-4 w-4" />
          <span className="font-medium">Assinatura Ativa</span>
        </div>
      );
    }

    if (trialDaysRemaining > 0) {
      return (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Teste Grátis: {trialDaysRemaining} {trialDaysRemaining === 1 ? "dia restante" : "dias restantes"}</span>
        </div>
      );
    }

    if (paymentStatus === "pending_approval") {
      return (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-yellow-400/10 text-yellow-400">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Aguardando Aprovação do Pagamento</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-destructive/10 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span className="font-medium">Assinatura Expirada</span>
      </div>
    );
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full gradient-primary">
            <User className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">{profile?.name || "Profissional"}</h1>
          <p className="text-sm text-muted-foreground">
            {professionalTypeLabels[profile?.professional_type || ""] || profile?.professional_type} • Plano {Object.values(PLANS).find(p => p.name.toLowerCase() === profile?.plan || p.name === profile?.plan)?.name || "Básico"}
          </p>
        </div>

        {/* Subscription Status Badge */}
        {getStatusBadge()}

        <div className="space-y-2">
          <div className="glass-card p-3 text-sm">
            <span className="text-muted-foreground">Email:</span> {profile?.email || user?.email}
          </div>
          <div className="glass-card p-3 text-sm">
            <span className="text-muted-foreground">Telefone:</span> {profile?.phone || "Não informado"}
          </div>
        </div>

        <button onClick={() => navigate("/subscription")} className="glass-card flex w-full items-center justify-between p-3 text-left">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Planos e Assinatura</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <Button onClick={handleLogout} variant="outline" className="w-full border-border text-destructive gap-2">
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>
    </PageContainer>
  );
};

export default Profile;
