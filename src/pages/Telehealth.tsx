import { useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Video, Clock, FileText, Link2, Plus, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PrescriptionModal from "@/components/telehealth/PrescriptionModal";
import ShareBookingLink from "@/components/telehealth/ShareBookingLink";
import CreateTeleconsultationModal from "@/components/telehealth/CreateTeleconsultationModal";
import PreCheckModal from "@/components/telehealth/PreCheckModal";
import EndCallModal from "@/components/telehealth/EndCallModal";
import { generateMedicalRecordPdf } from "@/utils/exportMedicalRecordPdf";
import { toast } from "sonner";

const VideoRoom = lazy(() => import("@/components/telehealth/VideoRoom"));

const Telehealth = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inCall, setInCall] = useState(false);
  const [callTc, setCallTc] = useState<any>(null);
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [prescriptionTc, setPrescriptionTc] = useState<any>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [preCheckOpen, setPreCheckOpen] = useState(false);
  const [pendingTc, setPendingTc] = useState<any>(null);
  const [endCallOpen, setEndCallOpen] = useState(false);
  const [callNotes, setCallNotes] = useState("");
  const [callMode, setCallMode] = useState<"video" | "audio" | "chat">("video");
  const [creatingRoom, setCreatingRoom] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name, professional_type, phone, crm").eq("user_id", user!.id).single();
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

  const handleStartClick = (tc: any) => {
    setPendingTc(tc);
    setPreCheckOpen(true);
  };

  const handlePreCheckReady = async () => {
    setPreCheckOpen(false);
    if (!pendingTc) return;

    setCreatingRoom(true);
    try {
      // Create room if not exists
      if (!pendingTc.room_url) {
        const { data, error } = await supabase.functions.invoke("daily-room", {
          body: { action: "create-room", teleconsultation_id: pendingTc.id },
        });
        if (error) throw error;
        pendingTc.room_url = data.room_url;
        pendingTc.room_name = data.room_name;
      }
      setCallTc({ ...pendingTc, ...getPatientInfo(pendingTc) });
      setInCall(true);
    } catch (err) {
      toast.error("Erro ao criar sala de vídeo. Tente novamente.");
      console.error(err);
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleCallEnd = (notes: string, mode: "video" | "audio" | "chat") => {
    setInCall(false);
    setCallNotes(notes);
    setCallMode(mode);
    setEndCallOpen(true);
    // Mark as completed
    if (callTc) {
      supabase.from("teleconsultations").update({ status: "completed" }).eq("id", callTc.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ["teleconsultations"] });
      });
    }
  };

  const handleSaveNow = () => {
    setEndCallOpen(false);
    if (callTc) {
      setPrescriptionTc(callTc);
      setPrescriptionOpen(true);
    }
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

  // In-call view
  if (inCall && callTc?.room_url) {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <VideoRoom
          roomUrl={callTc.room_url}
          patientName={callTc.patient_name}
          patientPhone={callTc.phone}
          isDoctor={true}
          onEnd={handleCallEnd}
        />
      </Suspense>
    );
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();
  const filtered = teleconsultations.filter((t: any) =>
    tab === "upcoming"
      ? t.status === "scheduled" && t.date >= oneHourAgo
      : t.status === "completed"
  );

  return (
    <PageContainer>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Telehealth</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShareOpen(true)} className="gap-1 text-xs">
              <Link2 className="h-3.5 w-3.5" /> Link
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1 text-xs gradient-primary">
              <Plus className="h-3.5 w-3.5" /> Nova Consulta
            </Button>
          </div>
        </div>

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

        {creatingRoom && (
          <div className="flex items-center justify-center gap-2 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Criando sala de vídeo...</span>
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma teleconsulta encontrada</p>}
          {filtered.map((tc: any) => {
            const patientInfo = getPatientInfo(tc);
            const tcDate = new Date(tc.date);
            const minutesUntil = (tcDate.getTime() - Date.now()) / 60000;
            const isStartingSoon = minutesUntil > 0 && minutesUntil <= 30;
            const isNow = minutesUntil <= 0 && tc.status === "scheduled";

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
                <div className="flex gap-2">
                  {tc.status === "scheduled" && (
                    <Button
                      onClick={() => handleStartClick(tc)}
                      size="sm"
                      className={`flex-1 gap-1 ${isNow ? "bg-green-600 hover:bg-green-700 text-white font-bold" : "gradient-primary"}`}
                    >
                      <Video className="h-4 w-4" />
                      {isNow ? "Entrar na consulta agora" : "Iniciar Consulta"}
                    </Button>
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

      <PreCheckModal open={preCheckOpen} onOpenChange={setPreCheckOpen} onReady={handlePreCheckReady} />

      <EndCallModal
        open={endCallOpen}
        onOpenChange={setEndCallOpen}
        mode={callMode}
        onSaveNow={handleSaveNow}
        onLater={() => setEndCallOpen(false)}
      />

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
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["teleconsultations"] })}
      />
    </PageContainer>
  );
};

export default Telehealth;
