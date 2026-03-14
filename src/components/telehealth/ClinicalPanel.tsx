import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Stethoscope, FileText, Award, Save,
  Loader2, ChevronDown, ChevronUp, Thermometer, ShieldCheck, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Cid10Autocomplete from "./Cid10Autocomplete";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getProfessionConfig } from "@/config/professions";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface VitalSigns {
  blood_pressure?: string;
  heart_rate?: string;
  temperature?: string;
  respiratory_rate?: string;
  oxygen_saturation?: string;
  weight?: string;
  height?: string;
}

interface ClinicalData {
  chief_complaint: string;
  history_present_illness: string;
  past_medical_history: string;
  family_history: string;
  social_history: string;
  allergies: string;
  current_medications: string;
  physical_exam: string;
  vital_signs: VitalSigns;
  diagnosis: string;
  icd_code: string;
  treatment_plan: string;
  prescription: string;
  certificate: string;
  follow_up_notes: string;
}

interface ClinicalPanelProps {
  userId: string;
  patientName: string;
  patientId: string | null;
  teleconsultationId: string;
  professionalType: string;
  onSaved: (data: ClinicalData) => void;
}

type Section = "anamnesis" | "exam" | "diagnosis" | "prescription" | "certificate";

const initialData: ClinicalData = {
  chief_complaint: "",
  history_present_illness: "",
  past_medical_history: "",
  family_history: "",
  social_history: "",
  allergies: "",
  current_medications: "",
  physical_exam: "",
  vital_signs: {},
  diagnosis: "",
  icd_code: "",
  treatment_plan: "",
  prescription: "",
  certificate: "",
  follow_up_notes: "",
};

const ClinicalPanel = ({ userId, patientName, patientId, teleconsultationId, professionalType, onSaved }: ClinicalPanelProps) => {
  const config = getProfessionConfig(professionalType);
  const [data, setData] = useState<ClinicalData>(initialData);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<Section>>(new Set(["anamnesis"]));
  const [saved, setSaved] = useState(false);
  const [showCertAlert, setShowCertAlert] = useState(false);
  const [showCertInfoModal, setShowCertInfoModal] = useState(false);
  const [isFirstSave, setIsFirstSave] = useState(true);


  const toggleSection = (s: Section) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const updateField = (field: keyof ClinicalData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const updateVital = (field: keyof VitalSigns, value: string) => {
    setData((prev) => ({
      ...prev,
      vital_signs: { ...prev.vital_signs, [field]: value },
    }));
    setSaved(false);
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("medical_records").insert({
        user_id: userId,
        patient_id: patientId,
        teleconsultation_id: teleconsultationId,
        patient_name: patientName,
        chief_complaint: data.chief_complaint || null,
        history_present_illness: data.history_present_illness || null,
        past_medical_history: data.past_medical_history || null,
        family_history: data.family_history || null,
        social_history: data.social_history || null,
        allergies: data.allergies || null,
        current_medications: data.current_medications || null,
        physical_exam: data.physical_exam || null,
        vital_signs: data.vital_signs,
        diagnosis: data.diagnosis || null,
        icd_code: data.icd_code || null,
        treatment_plan: data.treatment_plan || null,
        prescription: data.prescription || null,
        certificate: data.certificate || null,
        follow_up_notes: data.follow_up_notes || null,
      });

      if (error) throw error;

      if (patientId && data.chief_complaint) {
        await supabase.from("patients").update({
          initial_anamnesis: data.chief_complaint,
          medical_history: [data.past_medical_history, data.diagnosis].filter(Boolean).join("\n"),
          procedure_performed: data.treatment_plan || null,
        }).eq("id", patientId);
      }

      setSaved(true);
      toast.success("Prontuário salvo com sucesso!");
      onSaved(data);
    } catch {
      toast.error("Não conseguimos salvar. Tente de novo em instantes.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!data.chief_complaint.trim()) {
      toast.error(`Preencha ao menos: ${config.chiefComplaintLabel}.`);
      return;
    }

    if (isFirstSave) {
      setShowCertAlert(true);
      return;
    }

    await doSave();
  };

  const handleCertAlertContinue = async () => {
    setShowCertAlert(false);
    setIsFirstSave(false);
    await doSave();
  };

  const showVitals = ["medico", "dentista", "nutricionista", "fisioterapeuta"].includes(professionalType);

  const sections: { key: Section; icon: typeof ClipboardList; title: string }[] = [
    { key: "anamnesis", icon: ClipboardList, title: professionalType === "psicologo" ? "Histórico do Paciente" : "Anamnese" },
    { key: "exam", icon: Stethoscope, title: config.examLabel },
    { key: "diagnosis", icon: Stethoscope, title: config.diagnosisLabel },
    { key: "prescription", icon: FileText, title: config.prescriptionTitle },
    { key: "certificate", icon: Award, title: config.certificateTitle },
  ];

  return (
    <div className="space-y-3 pb-4">
      <div className="glass-card p-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{config.recordTitle}</p>
          <p className="text-sm font-semibold">{patientName}</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || saved}
          size="sm"
          className={`gap-1 ${saved ? "bg-success hover:bg-success" : "gradient-primary"}`}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar"}
        </Button>
      </div>

      {sections.map(({ key, icon: Icon, title }) => {
        const isExpanded = expandedSections.has(key);
        return (
          <div key={key} className="glass-card overflow-hidden">
            <button
              onClick={() => toggleSection(key)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{title}</span>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
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
                    {key === "anamnesis" && (
                      <>
                        <Field label={`${config.chiefComplaintLabel} *`} placeholder={config.chiefComplaintPlaceholder} value={data.chief_complaint} onChange={(v) => updateField("chief_complaint", v)} />
                        <Field label={config.historyLabel} placeholder={config.historyPlaceholder} value={data.history_present_illness} onChange={(v) => updateField("history_present_illness", v)} rows={3} />
                        {config.anamnesisFields.includes("past_medical_history") && (
                          <Field label="Antecedentes Pessoais" placeholder="Doenças prévias, cirurgias, internações..." value={data.past_medical_history} onChange={(v) => updateField("past_medical_history", v)} />
                        )}
                        {config.anamnesisFields.includes("family_history") && (
                          <Field label="Antecedentes Familiares" placeholder="Doenças na família..." value={data.family_history} onChange={(v) => updateField("family_history", v)} />
                        )}
                        {config.anamnesisFields.includes("social_history") && (
                          <Field label={professionalType === "nutricionista" ? "Hábitos Alimentares e Estilo de Vida" : "Hábitos de Vida"} placeholder={professionalType === "nutricionista" ? "Rotina alimentar, atividade física, consumo de água..." : "Tabagismo, etilismo, atividade física..."} value={data.social_history} onChange={(v) => updateField("social_history", v)} />
                        )}
                        {config.anamnesisFields.includes("allergies") && (
                          <Field label="Alergias" placeholder="Medicamentos, alimentos, materiais..." value={data.allergies} onChange={(v) => updateField("allergies", v)} rows={1} />
                        )}
                        {config.anamnesisFields.includes("current_medications") && (
                          <Field label="Medicações / Suplementos em Uso" placeholder="Nome, dose, frequência..." value={data.current_medications} onChange={(v) => updateField("current_medications", v)} />
                        )}
                      </>
                    )}

                    {key === "exam" && (
                      <>
                        {showVitals && (
                          <>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Thermometer className="h-3 w-3" /> Sinais Vitais
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <VitalField label="PA (mmHg)" placeholder="120/80" value={data.vital_signs.blood_pressure || ""} onChange={(v) => updateVital("blood_pressure", v)} />
                              <VitalField label="FC (bpm)" placeholder="72" value={data.vital_signs.heart_rate || ""} onChange={(v) => updateVital("heart_rate", v)} />
                              <VitalField label="Temp (°C)" placeholder="36.5" value={data.vital_signs.temperature || ""} onChange={(v) => updateVital("temperature", v)} />
                              {professionalType === "nutricionista" ? (
                                <>
                                  <VitalField label="Peso (kg)" placeholder="70" value={data.vital_signs.weight || ""} onChange={(v) => updateVital("weight", v)} />
                                  <VitalField label="Altura (m)" placeholder="1.75" value={data.vital_signs.height || ""} onChange={(v) => updateVital("height", v)} />
                                  <VitalField label="SpO2 (%)" placeholder="98" value={data.vital_signs.oxygen_saturation || ""} onChange={(v) => updateVital("oxygen_saturation", v)} />
                                </>
                              ) : (
                                <>
                                  <VitalField label="FR (irpm)" placeholder="16" value={data.vital_signs.respiratory_rate || ""} onChange={(v) => updateVital("respiratory_rate", v)} />
                                  <VitalField label="SpO2 (%)" placeholder="98" value={data.vital_signs.oxygen_saturation || ""} onChange={(v) => updateVital("oxygen_saturation", v)} />
                                  <VitalField label="Peso (kg)" placeholder="70" value={data.vital_signs.weight || ""} onChange={(v) => updateVital("weight", v)} />
                                </>
                              )}
                            </div>
                          </>
                        )}
                        <Field label={config.examLabel} placeholder={config.examPlaceholder} value={data.physical_exam} onChange={(v) => updateField("physical_exam", v)} rows={4} />
                      </>
                    )}

                    {key === "diagnosis" && (
                      <>
                        <Field label={config.diagnosisLabel} placeholder={config.diagnosisPlaceholder} value={data.diagnosis} onChange={(v) => updateField("diagnosis", v)} />
                        {config.usesIcd && (
                          <Cid10Autocomplete
                            value={data.icd_code}
                            onChange={(code) => updateField("icd_code", code)}
                            onDiagnosisSelect={(desc) => {
                              if (!data.diagnosis.trim()) updateField("diagnosis", desc);
                            }}
                          />
                        )}
                        <Field label={config.treatmentLabel} placeholder={config.treatmentPlaceholder} value={data.treatment_plan} onChange={(v) => updateField("treatment_plan", v)} rows={3} />
                        <Field label="Retorno / Acompanhamento" placeholder="Retorno em 7 dias, frequência semanal..." value={data.follow_up_notes} onChange={(v) => updateField("follow_up_notes", v)} rows={1} />
                      </>
                    )}

                    {key === "prescription" && (
                      <>
                        <div className="glass-card p-2.5 bg-primary/5">
                          <p className="text-[11px] text-muted-foreground">
                            ⚕️ {config.canPrescribeMedication
                              ? `A ${config.prescriptionTitle.toLowerCase()} será gerada como PDF timbrado com seus dados profissionais. ${config.legalResolution}.`
                              : `As orientações serão geradas como PDF timbrado. ${config.legalResolution}.`}
                          </p>
                        </div>
                        <Field label={config.prescriptionTitle} placeholder={config.prescriptionPlaceholder} value={data.prescription} onChange={(v) => updateField("prescription", v)} rows={5} />
                      </>
                    )}

                    {key === "certificate" && (
                      <>
                        <div className="glass-card p-2.5 bg-primary/5">
                          <p className="text-[11px] text-muted-foreground">
                            📋 O {config.certificateTitle.toLowerCase()} será gerado como PDF timbrado. Conforme a LGPD (Lei nº 13.709/2018), informações sensíveis de saúde só devem ser incluídas com autorização do paciente.
                          </p>
                        </div>
                        <Field label={config.certificateTitle} placeholder={config.certificatePlaceholder} value={data.certificate} onChange={(v) => updateField("certificate", v)} rows={4} />
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Certificate Digital Alert - first save */}
      <AlertDialog open={showCertAlert} onOpenChange={setShowCertAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <AlertDialogTitle className="text-base">Certificado Digital ICP-Brasil</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Para que seu prontuário eletrônico tenha validade legal plena conforme Resolução CFM 1.821/2007, é necessário assinar com certificado digital ICP-Brasil (A1 ou A3).
              <br /><br />
              <span className="font-medium text-foreground">Você já possui certificado digital?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleCertAlertContinue} className="w-full gradient-primary gap-1">
              <ShieldCheck className="h-4 w-4" /> Sim, tenho certificado
            </Button>
            <Button
              variant="outline"
              className="w-full gap-1"
              onClick={() => {
                setShowCertAlert(false);
                setShowCertInfoModal(true);
              }}
            >
              Não, quero saber mais
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Certificate Info Modal */}
      <Dialog open={showCertInfoModal} onOpenChange={setShowCertInfoModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-primary" />
              O que é o Certificado Digital ICP-Brasil?
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed pt-2 space-y-3">
              <p>
                O certificado digital ICP-Brasil é uma identidade eletrônica que garante autenticidade, integridade e validade jurídica aos documentos assinados digitalmente.
              </p>
              <p className="font-medium text-foreground">Tipos de certificado:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>A1:</strong> Armazenado no computador, válido por 1 ano. Mais prático para uso diário.</li>
                <li><strong>A3:</strong> Armazenado em token USB ou cartão, válido por até 3 anos. Mais seguro.</li>
              </ul>
              <p className="font-medium text-foreground">Como obter:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Acesse o site do ITI (Instituto Nacional de Tecnologia da Informação)</li>
                <li>Escolha uma Autoridade Certificadora credenciada</li>
                <li>Faça o pedido online e agende a validação presencial</li>
                <li>Compareça ao ponto de atendimento com documentos pessoais e do conselho profissional</li>
              </ol>
              <p className="text-xs text-muted-foreground">
                Conforme Resolução CFM nº 1.821/2007 e Lei nº 14.063/2020, o prontuário eletrônico deve ser assinado com certificado digital ICP-Brasil para ter validade legal plena.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full gap-1 gradient-primary">
              <a href="https://www.gov.br/iti/pt-br" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Acessar site do ITI (iti.gov.br)
              </a>
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowCertInfoModal(false);
                setIsFirstSave(false);
                doSave();
              }}
            >
              Entendi, salvar prontuário mesmo assim
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ label, placeholder, value, onChange, rows = 2 }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; rows?: number }) => (
  <div className="space-y-1">
    <Label className="text-[11px] text-muted-foreground">{label}</Label>
    <Textarea placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="bg-accent border-border text-sm resize-none" />
  </div>
);

const VitalField = ({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-0.5">
    <Label className="text-[10px] text-muted-foreground">{label}</Label>
    <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="bg-accent border-border h-8 text-sm" />
  </div>
);

export default ClinicalPanel;
