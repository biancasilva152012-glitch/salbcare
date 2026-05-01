import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageSkeleton from "@/components/PageSkeleton";
import { Video, Clock, FileText, Plus, Download, ExternalLink, Lock, Sparkles, MessageCircle, Copy, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PrescriptionModal from "@/components/telehealth/PrescriptionModal";
import CreateTeleconsultationModal from "@/components/telehealth/CreateTeleconsultationModal";
import JoinMeetConfirmModal from "@/components/telehealth/JoinMeetConfirmModal";
import ExportHistoryModal from "@/components/telehealth/ExportHistoryModal";
import { generateMedicalRecordPdf } from "@/utils/exportMedicalRecordPdf";
import { toast } from "sonner";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import FreemiumQuotaBanner from "@/components/FreemiumQuotaBanner";
import PremiumFeatureModal from "@/components/PremiumFeatureModal";
import { usePremiumFeature } from "@/hooks/usePremiumFeature";
import { logPremiumBlockAttempt } from "@/lib/premiumBlockTracker";
import { PLANS } from "@/config/plans";
import { openVersionedSubscriptionRoute } from "@/utils/subscriptionNavigation";
import { useNavigate } from "react-router-dom";

type TabKey = "today" | "upcoming" | "history";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending_payment: { label: "Aguardando pagamento", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500" },
  scheduled: { label: "Confirmada", color: "bg-green-500/10 text-green-600 dark:text-green-400", dot: "bg-green-500" },
  in_progress: { label: "Em andamento", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  completed: { label: "Encerrada", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const TelehealthInner = () => {
  const { user, subscription } = useAuth();
  const { hasAccess } = useFeatureGate();
  const { isFree, canCreateTelehealth, usageByModule } = useFreemiumLimits();
  const { canCreateTeleconsultation } = usePremiumFeature();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("today");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [prescriptionTc, setPrescriptionTc] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [confirmJoin, setConfirmJoin] = useState<{ tc: any; mode: "open" | "send" } | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name, professional_type, phone, crm, meet_link").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: teleconsultations = [] } = useQuery({
    queryKey: ["teleconsultations", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("teleconsultations").select("id, patient_name, patient_id, date, duration, notes, status, room_url, room_name").eq("user_id", user!.id).order("date", { ascending: false }).limit(500);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("id, name, phone").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const getPatientInfo = (tc: any) => {
    const patient = patients.find((p) => p.id === tc.patient_id || p.name === tc.patient_name);
    return { id: patient?.id || tc.patient_id, phone: patient?.phone || null };
  };

  // Resolve which Meet link to use: per-consultation room_url first, fallback to profile link
  const resolveMeetUrl = (tc: any): string | null =>
    tc.room_url || (profile as any)?.meet_link || null;

  const handleCopyLink = async (tc: any) => {
    const link = resolveMeetUrl(tc);
    if (!link) {
      toast.error("Esta consulta não tem link configurado.");
      return;
    }
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const handleDownloadRecord = (tc: any) => {
    const doc = generateMedicalRecordPdf({
      doctorName: profile?.name || "",
      professionalType: profile?.professional_type || "medico",
      doctorCrm: profile?.crm || "",
      patientName: tc.patient_name,
      consultationDate: tc.date,
    });
    doc.save(`prontuario-${tc.patient_name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`);
    toast.success("Prontuário baixado!");
  };

  const handleComplete = async (tc: any) => {
    await supabase.from("teleconsultations").update({ status: "completed" }).eq("id", tc.id);
    queryClient.invalidateQueries({ queryKey: ["teleconsultations"] });
    toast.success("Consulta marcada como concluída!");
  };

  // Categorize consultations into the 3 tabs
  const { todayList, upcomingList, historyList } = useMemo(() => {
    const today: any[] = [];
    const upcoming: any[] = [];
    const history: any[] = [];
    const now = new Date();

    teleconsultations.forEach((tc: any) => {
      const d = new Date(tc.date);
      if (tc.status === "completed") {
        history.push(tc);
      } else if (isSameDay(d, now)) {
        today.push(tc);
      } else if (d > now) {
        upcoming.push(tc);
      } else {
        // past but not completed → goes to history
        history.push(tc);
      }
    });
    // sort today/upcoming ascending (closest first), history descending
    today.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { todayList: today, upcomingList: upcoming, historyList: history };
  }, [teleconsultations]);

  const currentList =
    tab === "today" ? todayList : tab === "upcoming" ? upcomingList : historyList;

  const filteredList = useMemo(() => {
    if (statusFilter === "all") return currentList;
    return currentList.filter((c) => c.status === statusFilter);
  }, [currentList, statusFilter]);

  // Loading state
  if (profileLoading) {
    return <PageContainer backTo="/dashboard"><PageSkeleton variant="list" /></PageContainer>;
  }

  // Paywall for Essential plan
  const isEssential = subscription.plan === "basic";
  if (isEssential) {
    return (
      <PageContainer backTo="/dashboard">
        <div className="flex flex-col items-center justify-center space-y-5 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="max-w-xs space-y-2">
            <h2 className="text-lg font-bold">Teleconsulta Premium</h2>
            <p className="text-sm text-muted-foreground">
              Esta funcionalidade economiza horas do seu mês. Faça o upgrade para o Pro para liberar.
            </p>
          </div>
          <div className="glass-card p-4 max-w-xs w-full space-y-2">
            <p className="text-xs font-semibold text-primary flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> O que você ganha:</p>
            <ul className="text-xs text-muted-foreground space-y-1 text-left">
              <li>✅ Teleconsulta integrada com Google Meet</li>
              <li>✅ Prontuário eletrônico completo</li>
              <li>✅ Acesso a contador especialista</li>
              <li>✅ Emissão de NF-e 100% legal</li>
            </ul>
          </div>
          <Button onClick={openVersionedSubscriptionRoute} className="w-full max-w-xs gradient-primary font-semibold gap-2">
            <Sparkles className="h-4 w-4" />
            Assinar Essencial — R$ {PLANS.basic.price}/mês
          </Button>
          <Button onClick={() => window.history.back()} variant="ghost" className="text-muted-foreground">
            Agora não
          </Button>
        </div>
      </PageContainer>
    );
  }

  const meetLink = (profile as any)?.meet_link;

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "today", label: "Hoje", count: todayList.length },
    { key: "upcoming", label: "Próximas", count: upcomingList.length },
    { key: "history", label: "Histórico", count: historyList.length },
  ];

  return (
    <PageContainer backTo="/dashboard">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Teleconsulta</h1>
          {canCreateTeleconsultation ? (
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="gap-1 text-xs gradient-primary"
              data-testid="telehealth-new-btn"
            >
              <Plus className="h-3.5 w-3.5" /> Nova Consulta
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                logPremiumBlockAttempt("telehealth", "plan_required");
                setUpgradeOpen(true);
              }}
              className="gap-1 text-xs gradient-primary"
              data-testid="telehealth-new-btn-blocked"
            >
              <Lock className="h-3.5 w-3.5" /> Nova Consulta
            </Button>
          )}
        </div>

        <FreemiumQuotaBanner
          label="Teleconsultas"
          usage={usageByModule.telehealth}
          isFree={isFree}
          trackingKey="telehealth"
        />

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors flex-shrink-0 ${
                tab === t.key ? "gradient-primary text-primary-foreground" : "bg-accent text-muted-foreground"
              }`}
            >
              {t.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20" : "bg-background/60"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters + export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs bg-accent border-border w-full max-w-[200px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="scheduled">Confirmada</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="completed">Encerrada</SelectItem>
                <SelectItem value="pending_payment">Aguardando pagamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {tab === "history" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExportOpen(true)}
              className="gap-1 text-xs"
            >
              <Download className="h-3.5 w-3.5" /> Exportar PDF
            </Button>
          )}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {filteredList.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma teleconsulta encontrada
            </p>
          )}
          {filteredList.map((tc: any) => {
            const patientInfo = getPatientInfo(tc);
            const tcDate = new Date(tc.date);
            const statusKey = tc.status || "scheduled";
            const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.scheduled;
            const tcMeetUrl = resolveMeetUrl(tc);

            return (
              <div key={tc.id} className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                      {tc.patient_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tc.patient_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {tcDate.toLocaleDateString("pt-BR")} às {tcDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} — {tc.duration ? `${tc.duration} min` : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusCfg.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </div>

                {tc.notes && <p className="text-xs text-muted-foreground">{tc.notes}</p>}

                <div className="flex gap-2 flex-wrap">
                  {tc.status !== "completed" && (
                    <>
                      <Button
                        onClick={() => {
                          if (!tcMeetUrl) {
                            toast.error("Configure seu link Meet ou recrie a consulta.");
                            return;
                          }
                          setConfirmJoin({ tc, mode: "open" });
                        }}
                        size="sm"
                        className="flex-1 gap-1 gradient-primary"
                        disabled={!tcMeetUrl}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir Meet
                      </Button>
                      {patientInfo.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={() => setConfirmJoin({ tc, mode: "send" })}
                          title="Enviar link para o paciente"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button onClick={() => handleComplete(tc)} size="sm" variant="outline" className="text-xs">
                        Concluir
                      </Button>
                    </>
                  )}
                  {/* Copy link — always available when there is a link */}
                  {tcMeetUrl && (
                    <Button
                      onClick={() => handleCopyLink(tc)}
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      title="Copiar link da sala"
                    >
                      <Copy className="h-4 w-4" /> Copiar link
                    </Button>
                  )}
                  {/* Prescription/Certificate */}
                  <Button
                    onClick={() => {
                      setPrescriptionTc({ ...tc, ...patientInfo });
                      setPrescriptionOpen(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <FileText className="h-4 w-4" /> Receita/Atestado
                  </Button>
                  {tc.status === "completed" && (
                    <Button onClick={() => handleDownloadRecord(tc)} size="sm" variant="outline" className="gap-1">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {prescriptionTc && (
        <PrescriptionModal
          open={prescriptionOpen}
          onOpenChange={setPrescriptionOpen}
          patientName={prescriptionTc.patient_name}
          patientPhone={prescriptionTc.phone}
          patientId={prescriptionTc.id}
          teleconsultationId={prescriptionTc.id}
          doctorName={profile?.name || ""}
          professionalType={profile?.professional_type || "medico"}
          doctorCrm={profile?.crm || ""}
          userId={user?.id || ""}
        />
      )}

      <CreateTeleconsultationModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        userId={user?.id || ""}
        patients={patients}
        defaultMeetLink={meetLink || ""}
        doctorPhone={(profile as any)?.phone || ""}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["teleconsultations"] })}
      />

      {confirmJoin && (
        <JoinMeetConfirmModal
          open={!!confirmJoin}
          onOpenChange={(o) => !o && setConfirmJoin(null)}
          patientName={confirmJoin.tc.patient_name}
          date={confirmJoin.tc.date}
          duration={confirmJoin.tc.duration}
          meetUrl={resolveMeetUrl(confirmJoin.tc) || ""}
          patientPhone={getPatientInfo(confirmJoin.tc).phone}
          mode={confirmJoin.mode}
        />
      )}

      <ExportHistoryModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        consultations={teleconsultations}
        doctorName={profile?.name || ""}
        professionalType={profile?.professional_type}
        doctorCrm={profile?.crm || ""}
      />

      <PremiumFeatureModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        featureName="Teleconsulta integrada"
        description="A teleconsulta integrada com Google Meet é exclusiva do plano Essencial. Faça upgrade para criar e gerenciar suas videoconsultas."
      />
    </PageContainer>
  );
};

import PremiumOnlyGuard from "@/components/PremiumOnlyGuard";

const Telehealth = () => (
  <PremiumOnlyGuard
    feature="A Telessaúde"
    description="Crie e administre teleconsultas após assinar o plano Essencial."
    reason="telehealth"
    redirectAfter="/dashboard/telehealth"
  >
    <TelehealthInner />
  </PremiumOnlyGuard>
);

export default Telehealth;
