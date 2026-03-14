import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePrescriptionPdf } from "@/utils/exportPrescriptionPdf";
import { FileText, MessageCircle, Receipt, Loader2, Check } from "lucide-react";

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
  const [step, setStep] = useState<Step>("form");
  const [prescription, setPrescription] = useState("");
  const [certificate, setCertificate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const handleGenerate = async () => {
    if (!prescription.trim() && !certificate.trim()) {
      toast.error("Preencha ao menos a prescrição ou o atestado.");
      return;
    }

    setSaving(true);
    try {
      const doc = generatePrescriptionPdf({
        doctorName,
        doctorType,
        doctorCrm,
        patientName,
        prescription,
        certificate,
        notes,
      });

      const blob = doc.output("blob");
      setPdfBlob(blob);

      // Save to storage
      const fileName = `receita-${patientName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`;
      const storagePath = `${userId}/${teleconsultationId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(storagePath, blob, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      // Also save as patient document if patient exists
      if (patientId) {
        await supabase.from("patient_documents").insert({
          user_id: userId,
          patient_id: patientId,
          file_name: fileName,
          file_path: storagePath,
          file_type: "application/pdf",
          description: `Receita digital — Teleconsulta ${new Date().toLocaleDateString("pt-BR")}`,
        });
      }

      // Download for the doctor
      doc.save(fileName);

      toast.success("Receita gerada com sucesso!");
      setStep("actions");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar receita");
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
    const message = encodeURIComponent(
      `Olá ${patientName}, aqui está sua receita digital e orientações da nossa consulta realizada hoje no SalbCare. Desejamos uma boa recuperação! 💊`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, "_blank");
  };

  const handleInvoice = () => {
    setStep("done");
    // Navigate to invoices tab would be handled by parent
    toast.success("Redirecionando para emissão de Nota Fiscal...");
    onOpenChange(false);
    // Use setTimeout to allow modal to close
    setTimeout(() => {
      window.location.href = "/accounting?tab=invoices";
    }, 300);
  };

  const handleClose = () => {
    setStep("form");
    setPrescription("");
    setCertificate("");
    setNotes("");
    setPdfBlob(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {step === "form"
              ? "Receita e Atestado Digital"
              : step === "actions"
              ? "Documentos Gerados!"
              : "Tudo Pronto!"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4">
            <div className="glass-card p-3">
              <p className="text-xs text-muted-foreground">Paciente</p>
              <p className="font-semibold text-sm">{patientName}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Prescrição Médica
              </Label>
              <Textarea
                placeholder="Ex: Amoxicilina 500mg — Tomar 1 comprimido de 8 em 8 horas por 7 dias..."
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                rows={4}
                className="bg-accent border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Atestado Médico (opcional)
              </Label>
              <Textarea
                placeholder="Ex: Atesto para os devidos fins que o(a) paciente necessita de 3 dias de repouso..."
                value={certificate}
                onChange={(e) => setCertificate(e.target.value)}
                rows={3}
                className="bg-accent border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Orientações ao Paciente (opcional)
              </Label>
              <Textarea
                placeholder="Ex: Evitar exposição solar, manter repouso, retorno em 7 dias..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="bg-accent border-border"
              />
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mx-auto">
                <Check className="h-6 w-6 text-success" />
              </div>
              <p className="font-semibold text-sm">
                Receita digital de {patientName} gerada e salva!
              </p>
              <p className="text-xs text-muted-foreground">
                O PDF foi baixado e uma cópia foi salva no histórico do paciente.
              </p>
            </div>

            <Button
              onClick={handleWhatsApp}
              className="w-full font-semibold gap-2 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar para o Paciente via WhatsApp
            </Button>

            <div className="glass-card p-4 space-y-3">
              <p className="text-sm font-medium text-center">
                📋 Deseja que nossa contabilidade emita a Nota Fiscal desta consulta para o paciente solicitar reembolso?
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
  );
};

export default PrescriptionModal;
