import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Upload, Camera, Loader2, Check, Copy,
  ExternalLink, FilePlus, Stethoscope, AlertCircle, QrCode,
  ShieldAlert, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { maskCpf, maskPhone } from "@/utils/masks";
import { isValidCpf } from "@/utils/cpfValidator";
import { PROFESSION_CONFIG } from "@/config/professions";
import SEOHead from "@/components/SEOHead";
import { detectBlockedMedication, type PrescriptionColorScheme } from "@/utils/prescriptionColors";

interface MedicationEntry {
  name: string;
  dosage: string;
  posology: string;
}

const STEPS_PRESCRIPTION = ["Serviço", "Receita Anterior", "Pagamento", "Confirmação"];

const STEPS_CONSULTATION = ["Serviço", "Pagamento", "Confirmação"];

const ProntoAtendimentoFlow = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const professionalId = searchParams.get("professional");
  const professionalName = searchParams.get("name") || "Profissional";
  const initialService = searchParams.get("service") || "prescription";

  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState<"prescription" | "consultation">(
    initialService === "consultation" ? "consultation" : "prescription"
  );
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  // Prescription fields
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [medications, setMedications] = useState<MedicationEntry[]>([
    { name: "", dosage: "", posology: "" },
  ]);
  const [prevDoctorName, setPrevDoctorName] = useState("");
  const [prevDoctorCrm, setPrevDoctorCrm] = useState("");
  const [prevDate, setPrevDate] = useState("");
  const [isContinuousUse, setIsContinuousUse] = useState(false);
  const [blockedMedication, setBlockedMedication] = useState<PrescriptionColorScheme | null>(null);
  const [showBlockedInfo, setShowBlockedInfo] = useState(false);


  // Payment
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Patient data
  const [patient, setPatient] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    email: "",
    phone: "",
    address: "",
    allergies: "",
    employer: "",
    symptoms: "",
  });
  const [lgpdConsent, setLgpdConsent] = useState(false);

  const { data: doctor } = useQuery({
    queryKey: ["pronto-doctor", professionalId],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_professionals", { specialty_filter: null });
      return (data || []).find((p: any) => p.user_id === professionalId) || null;
    },
    enabled: !!professionalId,
  });

  const price = doctor?.consultation_price ? Number(doctor.consultation_price) : 0;
  const pixKey = (doctor as any)?.pix_key || "";
  const cardLink = (doctor as any)?.card_link || "";
  const config = PROFESSION_CONFIG[(doctor?.professional_type || "medico") as keyof typeof PROFESSION_CONFIG];

  const getSteps = () => {
    if (serviceType === "prescription") return STEPS_PRESCRIPTION;
    return STEPS_CONSULTATION;
  };

  // Handle prescription image upload + OCR
  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPrescriptionFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }

    // Upload to storage then run OCR
    setOcrLoading(true);
    try {
      const filePath = `ocr/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("prescription-uploads")
        .upload(filePath, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("prescription-uploads")
        .getPublicUrl(filePath);

      const { data, error } = await supabase.functions.invoke("extract-prescription", {
        body: { image_url: urlData.publicUrl },
      });

      if (!error && data && !data.error) {
        // Pre-fill extracted data
        if (data.medications?.length) {
          setMedications(
            data.medications.map((m: any) => ({
              name: m.name || "",
              dosage: m.dosage || "",
              posology: m.posology || "",
            }))
          );
        }
        if (data.doctor_name) setPrevDoctorName(data.doctor_name);
        if (data.doctor_crm) setPrevDoctorCrm(data.doctor_crm);
        if (data.prescription_date) setPrevDate(data.prescription_date);
        if (data.patient_name && !patient.name) {
          setPatient((p) => ({ ...p, name: data.patient_name }));
        }
        toast.success("Dados extraídos da receita! Confira e corrija se necessário.");
      } else {
        toast.info("Não foi possível extrair automaticamente. Preencha manualmente.");
      }
    } catch {
      toast.info("Preencha os dados da receita manualmente.");
    } finally {
      setOcrLoading(false);
    }
  };

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", posology: "" }]);
  };

  const updateMedication = (index: number, field: keyof MedicationEntry, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);

    // Check for blocked medications when name changes
    if (field === "name") {
      const allNames = updated.map(m => m.name).join(" ");
      let blocked: PrescriptionColorScheme | null = null;
      for (const med of updated) {
        const result = detectBlockedMedication(med.name);
        if (result) { blocked = result; break; }
      }
      setBlockedMedication(blocked);
    }
  };

  const removeMedication = (index: number) => {
    if (medications.length <= 1) return;
    setMedications(medications.filter((_, i) => i !== index));
  };

  // Handle receipt upload
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setReceiptFile(file);
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    toast.success("Chave Pix copiada!");
  };

  // Submit the complete request
  const handleSubmit = async () => {
    if (!professionalId) return;
    setLoading(true);
    try {
      // Upload receipt if exists
      let receiptPath = "";
      if (receiptFile) {
        const rPath = `receipts/${Date.now()}-${receiptFile.name}`;
        await supabase.storage.from("booking-receipts").upload(rPath, receiptFile);
        receiptPath = rPath;
      }

      const id = crypto.randomUUID();
      const { error } = await supabase.from("service_requests").insert({
        id,
        professional_id: professionalId,
        service_type: serviceType === "prescription" ? "prescription_renewal" : "consultation",
        status: "pending_review",
        patient_name: patient.name,
        patient_cpf: patient.cpf,
        patient_birth_date: patient.birthDate || null,
        patient_email: patient.email,
        patient_phone: patient.phone,
        patient_address: patient.address,
        patient_data: {
          allergies: patient.allergies,
          employer: patient.employer,
          symptoms: patient.symptoms,
          is_continuous_use: isContinuousUse,
        },
        prescription_data: serviceType === "prescription" ? {
          medications,
          prev_doctor_name: prevDoctorName,
          prev_doctor_crm: prevDoctorCrm,
          prev_date: prevDate,
        } : {},
        receipt_url: receiptPath,
        payment_status: receiptPath ? "pending_validation" : "pending",
        consultation_price: price,
      } as any);

      if (error) throw error;
      setRequestId(id);
      setStep(getSteps().length - 1); // Go to confirmation
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const steps = getSteps();

  const cpfError = patient.cpf.replace(/\D/g, "").length === 11 && !isValidCpf(patient.cpf) ? "CPF inválido" : "";

  // Step validation
  const canProceed = () => {
    if (step === 0) return !!patient.name && !!patient.cpf && isValidCpf(patient.cpf) && !!patient.birthDate && lgpdConsent;
    if (serviceType === "prescription") {
      if (step === 1) return medications.some((m) => m.name.trim()) && !blockedMedication;
      if (step === 2) return price === 0 || !!receiptFile;
    }
    if (serviceType === "consultation") {
      if (step === 1) return price === 0 || !!receiptFile;
    }
    return false;
  };

  const handleNext = () => {
    const isLastDataStep = step === steps.length - 2;
    if (isLastDataStep) {
      handleSubmit();
      return;
    }
    if (canProceed()) setStep(step + 1);
  };

  if (!professionalId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-3">
          <h1 className="text-lg font-bold">Link inválido</h1>
          <Button onClick={() => navigate("/pronto-atendimento")} variant="outline">Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-6 pb-32">
      <SEOHead title="Solicitar Atendimento | SalbCare" description="Solicite renovação de receita, atestado ou consulta online." />
      <div className="w-full max-w-lg space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/pronto-atendimento")} className="p-2 rounded-lg hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold">Solicitar Atendimento</p>
            <p className="text-[11px] text-muted-foreground">com {professionalName}</p>
          </div>
        </div>

        {/* Step indicator */}
        {step < steps.length - 1 && (
          <div className="flex items-center justify-center gap-1">
            {steps.slice(0, -1).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
                {i < steps.length - 2 && <div className={`h-px w-4 ${i < step ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 0: Service Selection */}
          {step === 0 && (
            <motion.div key="service" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-semibold">Qual serviço você precisa?</h2>

              <div className="grid gap-3">
                {[
                  { key: "prescription" as const, icon: FilePlus, title: "Renovação de Receita", desc: "Renove sua receita de uso contínuo mediante avaliação médica. Não atende medicamentos de tarja preta ou controlados C1/C2/C3." },
                  { key: "consultation" as const, icon: Stethoscope, title: "Consulta Online", desc: "Teleconsulta completa com profissional de saúde" },
                ].map(({ key, icon: Icon, title, desc }) => (
                  <button
                    key={key}
                    onClick={() => setServiceType(key)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      serviceType === key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        serviceType === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      {serviceType === key && <Check className="h-5 w-5 text-primary shrink-0 ml-auto" />}
                    </div>
                  </button>
                ))}
              </div>

              {serviceType === "consultation" && (
                <div className="space-y-2">
                  <Label htmlFor="chiefComplaint" className="text-xs font-medium">
                    Queixa principal / Motivo da consulta
                  </Label>
                  <Textarea
                    id="chiefComplaint"
                    placeholder="Descreva brevemente o motivo da sua consulta (ex: dor de cabeça frequente, acompanhamento de rotina...)"
                    value={patient.symptoms}
                    onChange={(e) => setPatient((p) => ({ ...p, symptoms: e.target.value }))}
                    className="bg-background border-border text-sm min-h-[80px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{patient.symptoms.length}/500</p>
                </div>
              )}

              {price > 0 && (
                <div className="text-center text-sm font-medium text-foreground">
                  Valor: <span className="text-primary">R$ {price.toFixed(2)}</span>
                </div>
              )}

              {/* Patient data inline */}
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="text-sm font-semibold">Seus Dados</h3>
                <p className="text-[11px] text-muted-foreground">Necessários para emissão do documento.</p>

                <div className="space-y-1.5">
                  <Label className="text-xs">Nome completo *</Label>
                  <Input value={patient.name} onChange={(e) => setPatient({ ...patient, name: e.target.value })} placeholder="Seu nome completo" className="bg-accent border-border" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">CPF *</Label>
                    <Input value={patient.cpf} onChange={(e) => setPatient({ ...patient, cpf: maskCpf(e.target.value) })} placeholder="000.000.000-00" className={`bg-accent border-border ${cpfError ? "border-destructive" : ""}`} />
                    {cpfError && <p className="text-[10px] text-destructive">{cpfError}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data de nascimento *</Label>
                    <Input type="date" value={patient.birthDate} onChange={(e) => setPatient({ ...patient, birthDate: e.target.value })} className="bg-accent border-border" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">E-mail</Label>
                  <Input type="email" value={patient.email} onChange={(e) => setPatient({ ...patient, email: e.target.value })} placeholder="seu@email.com" className="bg-accent border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">WhatsApp</Label>
                  <Input value={patient.phone} onChange={(e) => setPatient({ ...patient, phone: maskPhone(e.target.value) })} placeholder="(11) 99999-9999" className="bg-accent border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Endereço completo</Label>
                  <Input value={patient.address} onChange={(e) => setPatient({ ...patient, address: e.target.value })} placeholder="Rua, número, bairro, cidade - UF" className="bg-accent border-border" />
                </div>

                {serviceType === "prescription" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Alergias conhecidas</Label>
                    <Input value={patient.allergies} onChange={(e) => setPatient({ ...patient, allergies: e.target.value })} placeholder="Liste alergias ou 'Nenhuma'" className="bg-accent border-border" />
                  </div>
                )}

                {/* LGPD Consent */}
                <div className="rounded-lg border border-border p-3 space-y-2 bg-accent/30">
                  <div className="flex items-start gap-2">
                    <Checkbox checked={lgpdConsent} onCheckedChange={(v) => setLgpdConsent(!!v)} className="mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Autorizo o uso dos meus dados de saúde para fins de atendimento médico, conforme <strong>LGPD Art. 11</strong>. Seus dados serão vinculados ao seu CPF para consulta de histórico futuro.
                    </p>
                  </div>
                  {!lgpdConsent && (
                    <p className="text-[10px] text-destructive">* Consentimento obrigatório para prosseguir.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* PRESCRIPTION STEP 1: Upload + Medications */}
          {step === 1 && serviceType === "prescription" && (
            <motion.div key="rx" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <FilePlus className="h-4 w-4 text-primary" />
                Receita Anterior
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Fotografe ou envie a receita anterior. Os dados serão pré-preenchidos automaticamente.
              </p>

              {/* Upload area */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  onChange={handlePrescriptionUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center space-y-2 hover:border-primary/50 transition-colors">
                  {prescriptionPreview ? (
                    <img src={prescriptionPreview} alt="Receita" className="max-h-40 mx-auto rounded-lg" />
                  ) : (
                    <>
                      <div className="flex justify-center gap-3">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Toque para fotografar ou fazer upload</p>
                    </>
                  )}
                </div>
              </div>

              {ocrLoading && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Extraindo dados da receita...</span>
                </div>
              )}

              {/* Medications */}
              <div className="space-y-3">
                <p className="text-xs font-medium">Medicamentos:</p>
                {medications.map((med, i) => (
                  <div key={i} className="space-y-2 p-3 rounded-lg bg-accent/50 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">Medicamento {i + 1}</span>
                      {medications.length > 1 && (
                        <button onClick={() => removeMedication(i)} className="text-[10px] text-destructive hover:underline">Remover</button>
                      )}
                    </div>
                    <Input
                      placeholder="Nome do medicamento"
                      value={med.name}
                      onChange={(e) => updateMedication(i, "name", e.target.value)}
                      className="bg-background border-border text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Dosagem (ex: 500mg)"
                        value={med.dosage}
                        onChange={(e) => updateMedication(i, "dosage", e.target.value)}
                        className="bg-background border-border text-sm"
                      />
                      <Input
                        placeholder="Posologia (ex: 8/8h)"
                        value={med.posology}
                        onChange={(e) => updateMedication(i, "posology", e.target.value)}
                        className="bg-background border-border text-sm"
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addMedication} className="w-full text-xs">
                  + Adicionar medicamento
                </Button>
              </div>

              {/* Previous doctor info */}
              <div className="space-y-2">
                <p className="text-xs font-medium">Dados da receita anterior:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px]">Médico anterior</Label>
                    <Input value={prevDoctorName} onChange={(e) => setPrevDoctorName(e.target.value)} placeholder="Dr. Nome" className="bg-accent border-border text-sm" />
                  </div>
                  <div>
                    <Label className="text-[11px]">CRM/CRO</Label>
                    <Input value={prevDoctorCrm} onChange={(e) => setPrevDoctorCrm(e.target.value)} placeholder="12345" className="bg-accent border-border text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px]">Data da receita original</Label>
                  <Input value={prevDate} onChange={(e) => setPrevDate(e.target.value)} placeholder="dd/mm/aaaa" className="bg-accent border-border text-sm" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox checked={isContinuousUse} onCheckedChange={(v) => setIsContinuousUse(!!v)} />
                <Label className="text-xs">Uso contínuo</Label>
              </div>

              {/* Blocked medication alert */}
              {blockedMedication && (
                <div className="rounded-xl border-2 border-destructive/50 bg-destructive/5 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-destructive">Medicamento não permitido</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Este medicamento exige receituário especial físico e não pode ser renovado por teleconsulta. Consulte um médico presencialmente.
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">
                    {blockedMedication.blockReason}
                  </p>
                  <button
                    onClick={() => setShowBlockedInfo(!showBlockedInfo)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Info className="h-3.5 w-3.5" />
                    {showBlockedInfo ? "Ocultar detalhes" : "Entender mais →"}
                  </button>
                  {showBlockedInfo && (
                    <div className="rounded-lg bg-accent p-3 text-[11px] text-muted-foreground leading-relaxed space-y-2">
                      <p><strong>Por que este medicamento não pode ser renovado online?</strong></p>
                      <p>A ANVISA, por meio da Portaria 344/98 e RDC 471/2021, exige que medicamentos das listas C1 (psicotrópicos), C2 (retinoides), C3 (imunossupressores) e de tarja preta sejam prescritos exclusivamente com receituário especial físico, com retenção obrigatória na farmácia.</p>
                      <p>Receitas digitais ou por teleconsulta <strong>não substituem</strong> esse requisito legal. Consulte um médico presencialmente para obter a receita adequada.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Red stripe warning (allowed but with notice) */}
              {!blockedMedication && medications.some(m => m.name.trim()) && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground">
                      Receita válida mediante avaliação médica na teleconsulta. Sujeita à aprovação do profissional.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}


          {/* PAYMENT STEP */}
          {((serviceType === "prescription" && step === 2) ||
            (serviceType === "consultation" && step === 1)) && (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                Pagamento
              </h2>

              {price > 0 ? (
                <>
                  <div className="text-center py-3">
                    <p className="text-2xl font-bold text-primary">R$ {price.toFixed(2)}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Valor da consulta</p>
                  </div>

                  {/* PIX */}
                  {pixKey && (
                    <div className="space-y-2 p-3 rounded-lg bg-accent/50 border border-border">
                      <p className="text-xs font-medium">Pagar via Pix:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-background p-2 rounded border border-border truncate">{pixKey}</code>
                        <Button size="sm" variant="outline" onClick={copyPixKey}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Card */}
                  {cardLink && (
                    <div className="space-y-2 p-3 rounded-lg bg-accent/50 border border-border">
                      <p className="text-xs font-medium">Pagar via Cartão:</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => window.open(cardLink, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        Pagar com cartão
                      </Button>
                    </div>
                  )}

                  {/* Receipt upload */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Envie o comprovante de pagamento *</p>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        onChange={handleReceiptChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                        {receiptPreview ? (
                          <img src={receiptPreview} alt="Comprovante" className="max-h-32 mx-auto rounded-lg" />
                        ) : receiptFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-xs">{receiptFile.name}</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                            <p className="text-[11px] text-muted-foreground">Foto ou PDF do comprovante</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <Check className="h-10 w-10 text-green-500 mx-auto" />
                  <p className="text-sm font-medium">Atendimento gratuito</p>
                  <p className="text-[11px] text-muted-foreground">Prossiga para enviar sua solicitação.</p>
                </div>
              )}
            </motion.div>
          )}



          {/* CONFIRMATION STEP */}
          {step === steps.length - 1 && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-lg font-bold">Solicitação Enviada!</h2>
              <p className="text-sm text-muted-foreground">
                Sua solicitação de {serviceType === "prescription" ? "renovação de receita" : "consulta"} foi enviada para <strong>{professionalName}</strong>.
              </p>
              <p className="text-[11px] text-muted-foreground">
                O profissional avaliará sua solicitação e entrará em contato via WhatsApp ou e-mail.
              </p>

              {requestId && (
                <div className="p-3 bg-accent rounded-lg">
                  <p className="text-[11px] text-muted-foreground">Código da solicitação:</p>
                  <p className="text-sm font-mono font-bold text-foreground">{requestId.slice(0, 8).toUpperCase()}</p>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Button onClick={() => navigate(`/acompanhamento/${requestId}`)} className="w-full gradient-primary">
                  📍 Acompanhar Solicitação
                </Button>
                <Button variant="outline" onClick={() => navigate("/pronto-atendimento")} className="w-full text-xs">
                  Voltar ao Início
                </Button>
                <Button variant="ghost" onClick={() => navigate(`/pronto-atendimento/historico`)} className="w-full text-xs">
                  Consultar Histórico
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {step < steps.length - 1 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border p-4">
            <div className="max-w-lg mx-auto flex gap-3">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="flex-1 gradient-primary"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step === steps.length - 2 ? (
                  "Enviar Solicitação"
                ) : (
                  <>Próximo <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProntoAtendimentoFlow;
