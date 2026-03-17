import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut, User, CreditCard, ChevronRight, Clock, CheckCircle, AlertCircle, Shield, Download, Pencil, Trash2, Loader2, Banknote } from "lucide-react";
import { toast } from "sonner";
import { PLANS } from "@/config/plans";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { openVersionedSubscriptionRoute } from "@/utils/subscriptionNavigation";
import ConsultationSettings from "@/components/profile/ConsultationSettings";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  const [searchParams] = useSearchParams();
  const { user, signOut, subscription } = useAuth();
  const consultationRef = useRef<HTMLDivElement>(null);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [correctText, setCorrectText] = useState("");
  const [sendingCorrection, setSendingCorrection] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [cardLink, setCardLink] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

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

  // Sync local state with profile data
  useEffect(() => {
    if (profile) {
      setPixKey((profile as any).pix_key || "");
      setCardLink((profile as any).card_link || "");
    }
  }, [profile]);

  const handleSavePaymentData = async () => {
    if (!user) return;
    setSavingPayment(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ pix_key: pixKey.trim() || null, card_link: cardLink.trim() || null } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Dados de pagamento atualizados!");
    } catch {
      toast.error("Erro ao salvar dados de pagamento.");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDownloadData = async () => {
    if (!user) return;
    setDownloading(true);
    try {
      const [profileRes, patientsRes, appointmentsRes, financialRes, teleconsultationsRes, medicalRecordsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id),
        supabase.from("patients").select("*").eq("user_id", user.id),
        supabase.from("appointments").select("*").eq("user_id", user.id),
        supabase.from("financial_transactions").select("*").eq("user_id", user.id),
        supabase.from("teleconsultations").select("*").eq("user_id", user.id),
        (supabase as any).from("medical_records").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exportado_em: new Date().toISOString(),
        perfil: profileRes.data,
        pacientes: patientsRes.data,
        consultas: appointmentsRes.data,
        financeiro: financialRes.data,
        teleconsultas: teleconsultationsRes.data,
        prontuarios: medicalRecordsRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `salbcare-meus-dados-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dados exportados com sucesso!");
    } catch {
      toast.error("Não conseguimos salvar. Tente de novo em instantes.");
    } finally {
      setDownloading(false);
    }
  };

  const handleSendCorrection = async () => {
    if (!correctText.trim()) return;
    setSendingCorrection(true);
    try {
      await (supabase as any).from("chat_messages").insert({
        user_id: user!.id,
        content: `[SOLICITAÇÃO DE CORREÇÃO DE DADOS - LGPD Art. 18]\n\n${correctText}`,
        sender: "user",
      });
      toast.success("Solicitação enviada! Respondemos em até 15 dias úteis.");
      setCorrectText("");
      setCorrectOpen(false);
    } catch {
      toast.error("Não conseguimos salvar. Tente de novo em instantes.");
    } finally {
      setSendingCorrection(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await Promise.all([
        (supabase as any).from("medical_records").delete().eq("user_id", user.id),
        supabase.from("patient_documents").delete().eq("user_id", user.id),
        supabase.from("appointments").delete().eq("user_id", user.id),
        supabase.from("teleconsultations").delete().eq("user_id", user.id),
        supabase.from("financial_transactions").delete().eq("user_id", user.id),
        supabase.from("patients").delete().eq("user_id", user.id),
        supabase.from("professionals").delete().eq("user_id", user.id),
        (supabase as any).from("chat_messages").delete().eq("user_id", user.id),
        supabase.from("invoices").delete().eq("user_id", user.id),
        supabase.from("cnpj_requests").delete().eq("user_id", user.id),
        supabase.from("partner_hires").delete().eq("user_id", user.id),
      ]);

      await signOut();
      toast.success("Conta e dados excluídos. Você será redirecionado.");
      navigate("/login");
    } catch {
      toast.error("Erro ao excluir conta. Entre em contato: contato@salbcare.com.br");
    } finally {
      setDeleting(false);
      setDeleteStep(0);
    }
  };

  const getStatusBadge = () => {
    const { paymentStatus, trialDaysRemaining, subscribed } = subscription;

    if (paymentStatus === "active" || subscribed) {
      return (
        <div className="bg-success/10 text-success flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
          <CheckCircle className="h-4 w-4" />
          <span className="font-medium">Assinatura Ativa</span>
        </div>
      );
    }

    if (trialDaysRemaining > 0) {
      return (
        <div className="bg-primary/10 text-primary flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Teste Grátis: {trialDaysRemaining} {trialDaysRemaining === 1 ? "dia restante" : "dias restantes"}</span>
        </div>
      );
    }

    if (paymentStatus === "pending_approval") {
      return (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-400/10 px-3 py-2 text-xs text-yellow-400">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Aguardando Aprovação do Pagamento</span>
        </div>
      );
    }

    return (
      <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
        <AlertCircle className="h-4 w-4" />
        <span className="font-medium">Assinatura Expirada</span>
      </div>
    );
  };

  return (
    <PageContainer backTo="/dashboard">
      <div className="space-y-6">
        <div className="text-center">
          <div className="gradient-primary mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full">
            <User className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">{profile?.name || "Profissional"}</h1>
          <p className="text-sm text-muted-foreground">
            {professionalTypeLabels[profile?.professional_type || ""] || profile?.professional_type} • Plano {Object.values(PLANS).find((plan) => plan.name.toLowerCase() === profile?.plan || plan.name === profile?.plan)?.name || "Básico"}
          </p>
        </div>

        {getStatusBadge()}

        {profile?.suspended_until && new Date(profile.suspended_until) > new Date() && (
          <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">
              Perfil suspenso das buscas até {new Date(profile.suspended_until).toLocaleDateString("pt-BR")} devido a cancelamentos excessivos.
            </span>
          </div>
        )}

        <div className="space-y-2">
          <div className="glass-card p-3 text-sm">
            <span className="text-muted-foreground">Email:</span> {profile?.email || user?.email}
          </div>
          <div className="glass-card p-3 text-sm">
            <span className="text-muted-foreground">Telefone:</span> {profile?.phone || "Não informado"}
          </div>
        </div>

        <button onClick={openVersionedSubscriptionRoute} className="glass-card flex w-full items-center justify-between p-3 text-left">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Meu plano</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Payment Data Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Banknote className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Dados de pagamento</h2>
          </div>
          <div className="glass-card p-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pix-key" className="text-xs font-medium">Chave Pix</Label>
              <input
                id="pix-key"
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card-link" className="text-xs font-medium">Link de pagamento por cartão <span className="text-muted-foreground">(opcional)</span></Label>
              <input
                id="card-link"
                type="url"
                value={cardLink}
                onChange={(e) => setCardLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <Button
              onClick={handleSavePaymentData}
              disabled={savingPayment}
              size="sm"
              className="w-full gradient-primary font-semibold"
            >
              {savingPayment ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Salvando...</> : "Salvar dados de pagamento"}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground px-1">
            O paciente pagará diretamente para você via Pix. Você recebe 100% do valor.
          </p>
        </div>

        {/* Consultation Settings */}
        <ConsultationSettings />

        {/* LGPD - Privacy & Data Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Privacidade e meus dados</h2>
          </div>
          <p className="text-[11px] text-muted-foreground px-1">
            Conforme a LGPD (Lei nº 13.709/2018), você pode acessar, corrigir ou excluir seus dados a qualquer momento. Respondemos em até 15 dias úteis.
          </p>

          <button
            onClick={handleDownloadData}
            disabled={downloading}
            className="glass-card flex w-full items-center justify-between p-3 text-left"
          >
            <div className="flex items-center gap-3">
              {downloading ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <Download className="h-5 w-5 text-primary" />}
              <div>
                <span className="text-sm font-medium">Baixar meus dados</span>
                <p className="text-[10px] text-muted-foreground">Exporta todos os seus dados em formato JSON</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => setCorrectOpen(true)}
            className="glass-card flex w-full items-center justify-between p-3 text-left"
          >
            <div className="flex items-center gap-3">
              <Pencil className="h-5 w-5 text-primary" />
              <div>
                <span className="text-sm font-medium">Corrigir meus dados</span>
                <p className="text-[10px] text-muted-foreground">Solicite a correção de dados incorretos</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => setDeleteStep(1)}
            className="glass-card flex w-full items-center justify-between p-3 text-left"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-destructive" />
              <div>
                <span className="text-sm font-medium text-destructive">Excluir minha conta e dados</span>
                <p className="text-[10px] text-muted-foreground">Ação irreversível — todos os dados serão apagados</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <Button onClick={handleLogout} variant="outline" className="w-full border-border text-destructive gap-2">
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>

      {/* Correction Dialog */}
      <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="h-5 w-5 text-primary" />
              Corrigir meus dados
            </DialogTitle>
            <DialogDescription className="text-sm">
              Descreva quais dados precisam ser corrigidos. Responderemos em até 15 dias úteis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Descreva a correção necessária</Label>
              <Textarea
                placeholder="Ex: Meu nome está incorreto, o correto é..."
                value={correctText}
                onChange={(e) => setCorrectText(e.target.value)}
                rows={4}
                className="bg-accent border-border text-sm resize-none"
              />
            </div>
            <Button
              onClick={handleSendCorrection}
              disabled={!correctText.trim() || sendingCorrection}
              className="w-full gradient-primary"
            >
              {sendingCorrection ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {sendingCorrection ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account - Step 1 */}
      <AlertDialog open={deleteStep === 1} onOpenChange={(open) => { if (!open) setDeleteStep(0); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Excluir conta e dados</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Tem certeza que deseja excluir sua conta? Esta ação é <strong>irreversível</strong> e todos os seus dados serão apagados permanentemente:
              </p>
              <ul className="list-disc pl-4 text-sm space-y-1">
                <li>Perfil e informações pessoais</li>
                <li>Pacientes e prontuários</li>
                <li>Consultas e teleconsultas</li>
                <li>Dados financeiros e notas fiscais</li>
                <li>Mensagens do chat</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => setDeleteStep(2)} className="bg-destructive text-destructive-foreground">
              Sim, quero excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account - Step 2 (final confirmation) */}
      <AlertDialog open={deleteStep === 2} onOpenChange={(open) => { if (!open) setDeleteStep(0); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Confirmação final</AlertDialogTitle>
            <AlertDialogDescription>
              Esta é sua última chance. Ao confirmar, sua conta e <strong>todos os dados</strong> serão permanentemente excluídos. Não será possível recuperá-los.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground"
            >
              {deleting ? "Excluindo..." : "Excluir definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default Profile;
