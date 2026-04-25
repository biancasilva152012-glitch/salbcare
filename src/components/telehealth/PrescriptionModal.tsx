import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePrescriptionPdf } from "@/utils/exportPrescriptionPdf";
import { getProfessionConfig } from "@/config/professions";
import { FileText, MessageCircle, Receipt, Loader2, Check, ShieldCheck, AlertTriangle, Download, QrCode } from "lucide-react";
import SigningInstructionsModal from "@/components/telehealth/SigningInstructionsModal";
import PremiumFeatureModal from "@/components/PremiumFeatureModal";
import { usePremiumFeature } from "@/hooks/usePremiumFeature";

interface PrescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientPhone: string | null;
  patientId: string | null;
  teleconsultationId: string;
  doctorName: string;
  professionalType: string;
  doctorCrm: string;
  userId: string;
}

type Step = "form" | "actions" | "done";

const PrescriptionModal = ({
  open,
  onOpenChange,
  patientName,
  patientPhone,
  patientId,
  teleconsultationId,
  doctorName,
  professionalType,
  doctorCrm,
  userId,
}: PrescriptionModalProps) => {
  const config = getProfessionConfig(professionalType || "medico");

  const { canIssuePrescription } = usePremiumFeature();

  const [step, setStep] = useState<Step>("form");
  const [prescription, setPrescription] = useState("");
  const [certificate, setCertificate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [docHash, setDocHash] = useState("");

  // Bloqueio de plano: se o usuário não tem plano pago, exibe paywall e
  // impede a abertura do formulário (defesa em profundidade — RLS já bloqueia
  // a inserção em digital_documents no backend).
  if (open && !canIssuePrescription) {
    return (
      <PremiumFeatureModal
        open={open}
        onClose={() => onOpenChange(false)}
        featureName="Receitas e atestados digitais"
        description="A emissão de receitas (comum, controle especial, notificação azul/amarela) e atestados digitais é exclusiva do plano Essencial."
      />
    );
  }

  const handleGenerate = async () => {
    if (!prescription.trim() && !certificate.trim()) {
      toast.error(`Preencha ao menos ${config.canPrescribeMedication ? "a prescrição" : "as orientações"} ou o atestado.`);
      return;
    }

    setSaving(true);
    try {
      const doc = await generatePrescriptionPdf({
        doctorName,
        professionalType,
        doctorCrm,
        patientName,
        prescription,
        certificate,
        notes,
      });

      const blob = doc.output("blob");
      setPdfBlob(blob);

      const fileName = `${config.prescriptionTitle.toLowerCase().replace(/\s+/g, "-")}-${patientName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`;
      const storagePath = `${userId}/${teleconsultationId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(storagePath, blob, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      if (patientId) {
        await supabase.from("patient_documents").insert({
          user_id: userId,
          patient_id: patientId,
          file_name: fileName,
          file_path: storagePath,
          file_type: "application/pdf",
          description: `${config.prescriptionTitle} — Teleconsulta ${new Date().toLocaleDateString("pt-BR")}`,
        });
      }

      const hashCode = generateDocHashCode(doctorName, doctorCrm, patientName);
      setDocHash(hashCode);

      const docType = prescription.trim() ? "prescription" : "certificate";
      await supabase.from("digital_documents").insert({
        user_id: userId,
        patient_name: patientName,
        patient_id: patientId,
        document_type: docType,
        hash_code: hashCode,
        professional_name: doctorName,
        professional_type: professionalType,
        council_number: doctorCrm || null,
        signed_icp: false,
        file_path: storagePath,
      });

      doc.save(fileName);
      toast.success(`${config.prescriptionTitle} gerada com sucesso!`);
      setStep("actions");
    } catch (err: any) {
      console.error("Generate error:", err);
      toast.error("Não conseguimos salvar. Tente de novo em instantes.");
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = () => {
    const phone = (patientPhone || "").replace(/\D/g, "");
    if (!phone) {
      toast.error("Paciente não possui telefone cadastrado.");
      return;
    }
    const docType = config.prescriptionTitle.toLowerCase();
    const message = encodeURIComponent(
      `Olá ${patientName}, segue sua ${docType} e orientações da consulta realizada hoje no SalbCare. Qualquer dúvida, estou à disposição! 😊`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, "_blank");
  };

  const handleInvoice = () => {
    setStep("done");
    toast.success("Redirecionando para emissão de Nota Fiscal...");
    onOpenChange(false);
    setTimeout(() => {
      window.location.href = "/accounting?tab=invoices";
    }, 300);
  };

  const handleDownload = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `documento-${patientName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleClose = () => {
    setStep("form");
    setPrescription("");
    setCertificate("");
    setNotes("");
    setPdfBlob(null);
    setDocHash("");
    onOpenChange(false);
  };

  const formTitle = `${config.prescriptionTitle} e ${config.certificateTitle}`;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {step === "form"
                ? formTitle
                : step === "actions"
                ? "Documentos Gerados!"
                : "Tudo Pronto!"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Gerar documentos digitais para o paciente
            </DialogDescription>
          </DialogHeader>

          {step === "form" && (
            <div className="space-y-4">
              {/* Patient info */}
              <div className="glass-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Paciente</p>
                  <p className="font-semibold text-sm">{patientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                  <p className="text-xs font-medium">
                    {doctorCrm ? `${config.councilPrefix} ${doctorCrm}` : "Registro não informado"}
                  </p>
                </div>
              </div>

              {/* Prescription / Orientation */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  {config.prescriptionTitle}
                </Label>
                <Textarea
                  placeholder={config.prescriptionPlaceholder}
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  rows={5}
                  className="bg-accent border-border text-sm"
                />
                {!config.canPrescribeMedication && (
                  <p className="text-[10px] text-amber-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {config.label}s não prescrevem medicamentos. Use este campo para orientações terapêuticas.
                  </p>
                )}
              </div>

              {/* Certificate */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  {config.certificateTitle} (opcional)
                </Label>
                <Textarea
                  placeholder={config.certificatePlaceholder}
                  value={certificate}
                  onChange={(e) => setCertificate(e.target.value)}
                  rows={3}
                  className="bg-accent border-border text-sm"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  Orientações ao Paciente (opcional)
                </Label>
                <Textarea
                  placeholder="Cuidados, retorno, exames, recomendações..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="bg-accent border-border text-sm"
                />
              </div>

              {/* Legal notice */}
              <div className="glass-card p-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-semibold">Validade Legal</p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {config.legalResolution}. Para plena validade jurídica, recomenda-se
                  assinatura digital com certificado <strong>ICP-Brasil (A1 ou A3)</strong>.
                  Após gerar o PDF, você receberá instruções para assinar gratuitamente.
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={saving}
                className="w-full gradient-primary font-semibold gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {saving ? "Gerando..." : "Finalizar e Gerar PDF"}
              </Button>
            </div>
          )}

          {step === "actions" && (
            <div className="space-y-4">
              <div className="glass-card p-4 text-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold text-sm">
                  {config.prescriptionTitle} de {patientName} gerada e salva!
                </p>
                <p className="text-xs text-muted-foreground">
                  O PDF foi baixado e uma cópia foi salva no histórico do paciente.
                </p>
                {docHash && (
                  <p className="text-[10px] font-mono text-primary">
                    Código de verificação: {docHash}
                  </p>
                )}
              </div>

              {/* Download button */}
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full font-semibold gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar PDF novamente
              </Button>

              {/* Sign with ICP-Brasil button */}
              <Button
                onClick={() => setShowSigningModal(true)}
                className="w-full gradient-primary font-semibold gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Assinar com ICP-Brasil
              </Button>

              {/* Verification QR */}
              {docHash && (
                <div className="glass-card p-3 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <QrCode className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">Verificação de Autenticidade</span>
                  </div>
                  <a
                    href={`/verificar?hash=${docHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary underline underline-offset-2"
                  >
                    salbcare.lovable.app/verificar?hash={docHash}
                  </a>
                </div>
              )}

              <Button
                onClick={handleWhatsApp}
                className="w-full font-semibold gap-2 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar para o Paciente via WhatsApp
              </Button>

              <div className="glass-card p-4 space-y-3">
                <p className="text-sm font-medium text-center">
                  📋 Deseja que nossa contabilidade emita a Nota Fiscal desta consulta?
                </p>
                <Button
                  onClick={handleInvoice}
                  variant="outline"
                  className="w-full font-semibold gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  Sim, emitir nota
                </Button>
              </div>

              <Button variant="ghost" onClick={handleClose} className="w-full text-muted-foreground text-sm">
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SigningInstructionsModal
        open={showSigningModal}
        onOpenChange={setShowSigningModal}
        patientName={patientName}
        patientId={patientId}
        teleconsultationId={teleconsultationId}
        userId={userId}
        documentHash={docHash}
      />
    </>
  );
};

export default PrescriptionModal;

function generateDocHashCode(doctorName: string, doctorCrm: string, patientName: string): string {
  const timestamp = new Date().toISOString();
  const input = `${doctorName}|${doctorCrm}|${patientName}|${timestamp}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `SALB-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
}
