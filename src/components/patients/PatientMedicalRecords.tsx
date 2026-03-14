import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, ChevronDown, ChevronUp, Download, Calendar, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { generateMedicalRecordPdf } from "@/utils/exportMedicalRecordPdf";
import { toast } from "sonner";
import { getProfessionConfig } from "@/config/professions";

interface PatientMedicalRecordsProps {
  patientId: string;
  patientName: string;
}

const vitalLabels: Record<string, string> = {
  blood_pressure: "PA", heart_rate: "FC", temperature: "Temp",
  respiratory_rate: "FR", oxygen_saturation: "SpO2", weight: "Peso", height: "Altura",
};

const PatientMedicalRecords = ({ patientId, patientName }: PatientMedicalRecordsProps) => {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, professional_type, crm")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["medical-records", patientId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("medical_records")
        .select("*")
        .eq("patient_id", patientId)
        .eq("user_id", user!.id)
        .order("consultation_date", { ascending: false });
      return data || [];
    },
    enabled: !!user && !!patientId,
  });

  const config = getProfessionConfig(profile?.professional_type || "medico");

  const handleDownload = (record: any) => {
    const vitals = record.vital_signs || {};
    const doc = generateMedicalRecordPdf({
      doctorName: profile?.name || "",
      professionalType: profile?.professional_type || "medico",
      doctorCrm: profile?.crm || "",
      patientName: record.patient_name || patientName,
      consultationDate: record.consultation_date,
      chiefComplaint: record.chief_complaint,
      historyPresentIllness: record.history_present_illness,
      pastMedicalHistory: record.past_medical_history,
      familyHistory: record.family_history,
      socialHistory: record.social_history,
      allergies: record.allergies,
      currentMedications: record.current_medications,
      physicalExam: record.physical_exam,
      vitalSigns: vitals,
      diagnosis: record.diagnosis,
      icdCode: record.icd_code,
      treatmentPlan: record.treatment_plan,
      prescription: record.prescription,
      certificate: record.certificate,
      followUpNotes: record.follow_up_notes,
    });
    doc.save(`prontuario-${patientName.toLowerCase().replace(/\s+/g, "-")}-${new Date(record.consultation_date).toISOString().slice(0, 10)}.pdf`);
    toast.success("Prontuário baixado!");
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase">Prontuários</span>
        </div>
        <p className="text-xs text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase">Prontuários</span>
        </div>
        <p className="text-xs text-muted-foreground">Nenhum prontuário registrado para este paciente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          Prontuários ({records.length})
        </span>
      </div>

      {records.map((record: any) => {
        const isExpanded = expandedId === record.id;
        const date = new Date(record.consultation_date);
        const vitals = record.vital_signs || {};
        const hasVitals = Object.values(vitals).some((v: any) => v?.trim?.());

        return (
          <div key={record.id} className="rounded-lg bg-accent overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : record.id)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium">
                  {date.toLocaleDateString("pt-BR")} — {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={(e) => { e.stopPropagation(); handleDownload(record); }}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-3">
                    {record.chief_complaint && (
                      <RecordField label={config.chiefComplaintLabel} value={record.chief_complaint} />
                    )}
                    {record.history_present_illness && (
                      <RecordField label={config.historyLabel} value={record.history_present_illness} />
                    )}
                    {record.past_medical_history && (
                      <RecordField label="Antecedentes Pessoais" value={record.past_medical_history} />
                    )}
                    {record.family_history && (
                      <RecordField label="Antecedentes Familiares" value={record.family_history} />
                    )}
                    {record.social_history && (
                      <RecordField label="Hábitos de Vida" value={record.social_history} />
                    )}
                    {record.allergies && (
                      <RecordField label="Alergias" value={record.allergies} />
                    )}
                    {record.current_medications && (
                      <RecordField label="Medicações em Uso" value={record.current_medications} />
                    )}

                    {hasVitals && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" /> Sinais Vitais
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(vitals)
                            .filter(([, v]: any) => v?.trim?.())
                            .map(([k, v]: any) => (
                              <span key={k} className="text-xs bg-background rounded px-2 py-1">
                                <span className="text-muted-foreground">{vitalLabels[k] || k}:</span> {v}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {record.physical_exam && (
                      <RecordField label={config.examLabel} value={record.physical_exam} />
                    )}
                    {record.diagnosis && (
                      <RecordField
                        label={`${config.diagnosisLabel}${record.icd_code ? ` (CID: ${record.icd_code})` : ""}`}
                        value={record.diagnosis}
                      />
                    )}
                    {record.treatment_plan && (
                      <RecordField label={config.treatmentLabel} value={record.treatment_plan} />
                    )}
                    {record.prescription && (
                      <RecordField label={config.prescriptionTitle} value={record.prescription} highlight />
                    )}
                    {record.certificate && (
                      <RecordField label={config.certificateTitle} value={record.certificate} highlight />
                    )}
                    {record.follow_up_notes && (
                      <RecordField label="Retorno / Acompanhamento" value={record.follow_up_notes} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

const RecordField = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={highlight ? "rounded-md bg-primary/5 p-2" : ""}>
    <p className="text-[11px] font-semibold text-muted-foreground uppercase">{label}</p>
    <p className="text-sm mt-0.5 whitespace-pre-wrap">{value}</p>
  </div>
);

export default PatientMedicalRecords;
