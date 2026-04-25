import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, User, CreditCard, ChevronRight, Clock, CheckCircle, AlertCircle, Shield, Download, Pencil, Trash2, Loader2, BadgeCheck, TriangleAlert, Save, MapPin } from "lucide-react";
import { toast } from "sonner";
import { PLANS } from "@/config/plans";
import { getProfessionConfig } from "@/config/professions";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import PageSkeleton from "@/components/PageSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import GuestPaywall from "@/components/GuestPaywall";
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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

const professionalTypeLabels: Record<string, string> = {
  medico: "Médico(a)",
  dentista: "Cirurgião(ã)-Dentista",
  psicologo: "Psicólogo(a)",
  fisioterapeuta: "Fisioterapeuta",
  nutricionista: "Nutricionista",
  outro: "Outro",
};

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut, subscription } = useAuth();
  if (!user) {
    return (
      <GuestPaywall
        feature="o seu Perfil"
        description="Crie sua conta grátis para configurar perfil público, agenda, valores e assinatura."
        redirectAfterSignup="/profile"
      />
    );
  }
  const queryClient = useQueryClient();
  const consultationRef = useRef<HTMLDivElement>(null);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [correctText, setCorrectText] = useState("");
  const [sendingCorrection, setSendingCorrection] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [bio, setBio] = useState("");
  const [councilNumber, setCouncilNumber] = useState("");
  const [councilState, setCouncilState] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [savingRegistration, setSavingRegistration] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name, email, phone, professional_type, plan, payment_status, trial_start_date, pix_key, card_link, suspended_until, meet_link, consultation_price, avatar_url, user_id, bio, availability_online, council_number, council_state, office_address").eq("user_id", user!.id).single();
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
      setBio((profile as any).bio || "");
      setCouncilNumber((profile as any).council_number || "");
      setCouncilState((profile as any).council_state || "");
      setOfficeAddress((profile as any).office_address || "");
    }
  }, [profile]);

  // Auto-scroll to consultation settings when ?tab=consultation
  useEffect(() => {
    if (searchParams.get("tab") === "consultation" && consultationRef.current) {
      setTimeout(() => consultationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [searchParams, profile]);

  const profConfig = getProfessionConfig(profile?.professional_type || "medico");
  const hasCouncil = !!councilNumber.trim();

  const handleSaveRegistration = async () => {
    if (!user) return;
    setSavingRegistration(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          council_number: councilNumber.trim() || null,
          council_state: councilState.trim().toUpperCase() || null,
          office_address: officeAddress.trim() || null,
        } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Registro profissional atualizado!");
    } catch {
      toast.error("Erro ao salvar registro.");
    } finally {
      setSavingRegistration(false);
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
      toast.error("Erro ao excluir conta. Entre em contato: biancadealbuquerquep@gmail.com");
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

  if (profileLoading) {
    return <PageContainer backTo="/dashboard"><PageSkeleton variant="list" /></PageContainer>;
  }

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

        {/* Professional Registration Card */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <BadgeCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Registro profissional</h2>
          </div>
          {!hasCouncil && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              <span>Cadastre seu {profConfig.councilPrefix} para emitir receitas e atestados digitais.</span>
            </div>
          )}
          {hasCouncil && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{profConfig.councilPrefix}{councilState ? `-${councilState.toUpperCase()}` : ""} {councilNumber} — registro validado</span>
            </div>
          )}
          <div className="glass-card p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nº {profConfig.councilPrefix}</Label>
                <Input
                  value={councilNumber}
                  onChange={(e) => setCouncilNumber(e.target.value)}
                  placeholder="Ex: 12345"
                  className="bg-accent border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">UF do Conselho</Label>
                <Input
                  value={councilState}
                  onChange={(e) => setCouncilState(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="Ex: SP"
                  maxLength={2}
                  className="bg-accent border-border"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Endereço do consultório <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade - UF"
                className="bg-accent border-border"
              />
            </div>
            <Button
              onClick={handleSaveRegistration}
              disabled={savingRegistration}
              size="sm"
              className="w-full gradient-primary font-semibold gap-1.5"
            >
              {savingRegistration ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savingRegistration ? "Salvando..." : "Salvar registro profissional"}
            </Button>
          </div>
        </div>

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


        {/* Bio / About */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <User className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Sobre mim (visível para pacientes)</h2>
          </div>
          <div className="glass-card p-3 space-y-2">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 300))}
              placeholder="Ex: Psicóloga clínica com 10 anos de experiência em terapia cognitivo-comportamental..."
              className="bg-accent border-border text-sm resize-none"
              rows={3}
            />
            <p className="text-[10px] text-muted-foreground text-right">{bio.length}/300</p>
            <Button
              size="sm"
              className="w-full gradient-primary font-semibold"
              onClick={async () => {
                await supabase.from("profiles").update({ bio: bio.trim() || null } as any).eq("user_id", user!.id);
                queryClient.invalidateQueries({ queryKey: ["profile", user!.id] });
                toast.success("Bio atualizada!");
              }}
            >
              Salvar bio
            </Button>
          </div>
        </div>

        <button onClick={openVersionedSubscriptionRoute} className="glass-card flex w-full items-center justify-between p-3 text-left">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Meu plano</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

        {/* Consultation Settings */}
        <div ref={consultationRef}>
          <ConsultationSettings />
        </div>

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
            onClick={() => navigate("/profile/audit")}
            className="glass-card flex w-full items-center justify-between p-3 text-left"
            data-testid="profile-audit-link"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <span className="text-sm font-medium">Auditoria de redirecionamentos</span>
                <p className="text-[10px] text-muted-foreground">Histórico dos redirects seguros vinculados à sua conta</p>
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
