import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Clock, FileText, Link2, Plus, Download, ExternalLink, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PrescriptionModal from "@/components/telehealth/PrescriptionModal";
import ShareBookingLink from "@/components/telehealth/ShareBookingLink";
import CreateTeleconsultationModal from "@/components/telehealth/CreateTeleconsultationModal";
import { generateMedicalRecordPdf } from "@/utils/exportMedicalRecordPdf";
import { toast } from "sonner";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { PLANS } from "@/config/plans";
import { openVersionedSubscriptionRoute } from "@/utils/subscriptionNavigation";

const Telehealth = () => {
  const { user, subscription } = useAuth();
  const { hasAccess } = useFeatureGate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [prescriptionTc, setPrescriptionTc] = useState<any>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: profile } = useQuery({
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
      const { data } = await supabase.from("teleconsultations").select("*").eq("user_id", user!.id).order("date", { ascending: false });
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

  const handleJoinMeet = (tc: any) => {
    const link = tc.room_url || (profile as any)?.meet_link;
    if (!link) {
      toast.error("Por favor, insira o link do Google Meet para esta consulta.");
      return;
    }
    window.open(link, "_blank");
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
            Upgrade Pro — R$ {PLANS.professional.price}/mês
          </Button>
          <Button onClick={() => window.history.back()} variant="ghost" className="text-muted-foreground">
            Agora não
          </Button>
        </div>
      </PageContainer>
    );
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const filtered = teleconsultations.filter((t: any) =>
    tab === "upcoming"
      ? t.status === "scheduled" && t.date >= oneHourAgo
      : t.status === "completed"
  );

  return (
    <PageContainer backTo="/dashboard">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Teleconsulta</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShareOpen(true)} className="gap-1 text-xs">
              <Link2 className="h-3.5 w-3.5" /> Link
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1 text-xs gradient-primary">
              <Plus className="h-3.5 w-3.5" /> Nova Consulta
            </Button>
          </div>
        </div>

        {!(profile as any)?.meet_link && (
          <div className="glass-card p-3 border-yellow-500/30 bg-yellow-500/5">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              ⚠️ Configure seu link padrão do Google Meet no <a href="/profile" className="underline font-medium">Perfil</a> para agilizar suas consultas.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {(["upcoming", "completed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t ? "gradient-primary text-primary-foreground" : "bg-accent text-muted-foreground"
              }`}
            >
              {t === "upcoming" ? "Próximas" : "Histórico"}
            </button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma teleconsulta encontrada</p>}
          {filtered.map((tc: any) => {
            const patientInfo = getPatientInfo(tc);
            const tcDate = new Date(tc.date);
            const minutesUntil = (tcDate.getTime() - Date.now()) / 60000;
            const isStartingSoon = minutesUntil > 0 && minutesUntil <= 30;
            const isNow = minutesUntil <= 0 && tc.status === "scheduled";
            const meetLink = tc.room_url || (profile as any)?.meet_link;

            return (
              <div key={tc.id} className="glass-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                      {tc.patient_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{tc.patient_name}</p>
                        {isStartingSoon && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Iniciar em breve
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {tcDate.toLocaleDateString("pt-BR")} • {tc.duration ? `${tc.duration} min` : "—"}
                      </div>
                    </div>
                  </div>
                </div>
                {tc.notes && <p className="text-xs text-muted-foreground">{tc.notes}</p>}
                {meetLink && (
                  <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                    <Link2 className="h-3 w-3 shrink-0" /> {meetLink}
                  </p>
                )}
                <div className="flex gap-2">
                  {tc.status === "scheduled" && (
                    <>
                      <Button
                        onClick={() => handleJoinMeet(tc)}
                        size="sm"
                        className={`flex-1 gap-1 ${isNow ? "bg-green-600 hover:bg-green-700 text-white font-bold" : "gradient-primary"}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {isNow ? "Entrar na consulta agora" : "Abrir Google Meet"}
                      </Button>
                      <Button onClick={() => handleComplete(tc)} size="sm" variant="outline" className="text-xs">
                        Concluir
                      </Button>
                    </>
                  )}
                  {tc.status === "completed" && (
                    <>
                      <Button
                        onClick={() => {
                          setPrescriptionTc({ ...tc, ...patientInfo });
                          setPrescriptionOpen(true);
                        }}
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                      >
                        <FileText className="h-4 w-4" /> Receita/Atestado
                      </Button>
                      <Button onClick={() => handleDownloadRecord(tc)} size="sm" variant="outline" className="gap-1">
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
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

      <ShareBookingLink open={shareOpen} onOpenChange={setShareOpen} userId={user?.id || ""} doctorName={profile?.name || ""} />

      <CreateTeleconsultationModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        userId={user?.id || ""}
        patients={patients}
        defaultMeetLink={(profile as any)?.meet_link || ""}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["teleconsultations"] })}
      />
    </PageContainer>
  );
};

export default Telehealth;
