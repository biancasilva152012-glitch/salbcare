import { useState } from "react";
import { motion } from "framer-motion";
import { Video, PhoneOff, Mic, MicOff, Monitor, Clock, FileText, Link2, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PrescriptionModal from "@/components/telehealth/PrescriptionModal";
import ShareBookingLink from "@/components/telehealth/ShareBookingLink";
import CreateTeleconsultationModal from "@/components/telehealth/CreateTeleconsultationModal";
import ClinicalPanel from "@/components/telehealth/ClinicalPanel";
import { generateMedicalRecordPdf } from "@/utils/exportMedicalRecordPdf";
import { generatePrescriptionPdf } from "@/utils/exportPrescriptionPdf";
import { toast } from "sonner";

const Telehealth = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inCall, setInCall] = useState(false);
  const [callPatient, setCallPatient] = useState("");
  const [callTcId, setCallTcId] = useState("");
  const [callPatientId, setCallPatientId] = useState<string | null>(null);
  const [callPatientPhone, setCallPatientPhone] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [prescriptionTc, setPrescriptionTc] = useState<any>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [clinicalSaved, setClinicalSaved] = useState(false);
  const [savedClinicalData, setSavedClinicalData] = useState<any>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, professional_type, phone, crm")
        .eq("user_id", user!.id)
        .single();
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

  const professionalTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      medico: "Médico(a)", dentista: "Dentista", psicologo: "Psicólogo(a)",
      fisioterapeuta: "Fisioterapeuta", nutricionista: "Nutricionista",
    };
    return map[type] || type;
  };

  const getPatientInfo = (tc: any) => {
    const patient = patients.find((p) => p.id === tc.patient_id || p.name === tc.patient_name);
    return { id: patient?.id || tc.patient_id, phone: patient?.phone || null };
  };

  const handleEndCall = async () => {
    // Mark teleconsultation as completed
    await supabase.from("teleconsultations").update({ status: "completed" }).eq("id", callTcId);
    queryClient.invalidateQueries({ queryKey: ["teleconsultations"] });

    setInCall(false);

    // If clinical data was saved with prescription or certificate, open the PDF generation
    if (savedClinicalData && (savedClinicalData.prescription || savedClinicalData.certificate)) {
      const tc = teleconsultations.find((t) => t.id === callTcId);
      if (tc) {
        setPrescriptionTc({
          ...tc,
          ...getPatientInfo(tc),
        });
        setPrescriptionOpen(true);
      }
    }

    setClinicalSaved(false);
    setSavedClinicalData(null);
  };

  const handleClinicalSaved = (data: any) => {
    setClinicalSaved(true);
    setSavedClinicalData(data);
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

  // In-call view with clinical panel
  if (inCall) {
    const initials = callPatient.split(" ").map((n: string) => n[0]).join("").substring(0, 2);
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold">{callPatient}</p>
              <p className="text-[11px] text-muted-foreground">Teleconsulta em andamento</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMuted(!muted)} className={`flex h-10 w-10 items-center justify-center rounded-full ${muted ? "bg-destructive text-destructive-foreground" : "bg-accent"}`}>
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
              <Monitor className="h-4 w-4" />
            </button>
            <button onClick={handleEndCall} className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <PhoneOff className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Clinical panel scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ClinicalPanel
            userId={user?.id || ""}
            patientName={callPatient}
            patientId={callPatientId}
            teleconsultationId={callTcId}
            professionalType={profile?.professional_type || "medico"}
            onSaved={handleClinicalSaved}
          />
        </div>
      </div>
    );
  }

  const now = new Date().toISOString();
  const filtered = teleconsultations.filter((t) =>
    tab === "upcoming" ? t.status === "scheduled" && t.date >= now : t.status === "completed"
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma teleconsulta encontrada</p>}
          {filtered.map((tc) => {
            const patientInfo = getPatientInfo(tc);
            return (
              <div key={tc.id} className="glass-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                      {tc.patient_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tc.patient_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(tc.date).toLocaleDateString("pt-BR")} • {tc.duration ? `${tc.duration} min` : "—"}
                      </div>
                    </div>
                  </div>
                </div>
                {tc.notes && <p className="text-xs text-muted-foreground">{tc.notes}</p>}
                <div className="flex gap-2">
                  {tc.status === "scheduled" && (
                    <Button
                      onClick={() => {
                        setCallPatient(tc.patient_name);
                        setCallTcId(tc.id);
                        setCallPatientId(patientInfo.id);
                        setCallPatientPhone(patientInfo.phone);
                        setInCall(true);
                      }}
                      size="sm"
                      className="flex-1 gradient-primary gap-1"
                    >
                      <Video className="h-4 w-4" /> Iniciar Consulta
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
                      <Button
                        onClick={() => handleDownloadRecord(tc)}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
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
          doctorType={professionalTypeLabel(profile?.professional_type || "medico")}
          doctorCrm={profile?.crm || ""}
          userId={user?.id || ""}
        />
      )}

      <ShareBookingLink
        open={shareOpen}
        onOpenChange={setShareOpen}
        userId={user?.id || ""}
        doctorName={profile?.name || ""}
      />

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
