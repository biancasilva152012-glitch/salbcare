import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Upload, ShieldCheck, Monitor, CreditCard, Loader2, Check } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientId: string | null;
  teleconsultationId: string;
  userId: string;
  documentHash: string;
}

const SigningInstructionsModal = ({ open, onOpenChange, patientName, patientId, teleconsultationId, userId, documentHash }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUploadSigned = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Envie apenas arquivos PDF.");
      return;
    }

    setUploading(true);
    try {
      const fileName = `assinado-${patientName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`;
      const storagePath = `${userId}/${teleconsultationId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(storagePath, file, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      if (patientId) {
        await supabase.from("patient_documents").insert({
          user_id: userId,
          patient_id: patientId,
          file_name: fileName,
          file_path: storagePath,
          file_type: "application/pdf",
          description: `Documento assinado ICP-Brasil — ${patientName} — ${new Date().toLocaleDateString("pt-BR")}`,
        });
      }

      // Update digital_documents to mark as signed
      if (documentHash) {
        await supabase
          .from("digital_documents")
          .update({ signed_icp: true } as any)
          .eq("hash_code", documentHash)
          .eq("user_id", userId);
      }

      setUploaded(true);
      toast.success("Documento assinado salvo com sucesso no histórico do paciente!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Erro ao enviar o documento. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setUploaded(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Assinar Documento com ICP-Brasil
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Para garantir a validade legal do seu documento, assine digitalmente usando seu certificado ICP-Brasil pessoal (e-CPF ou e-CRM). Veja como fazer gratuitamente:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Option 1 - ITI */}
          <div className="glass-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-semibold">Opção 1 — Assinador ITI (gratuito, oficial do governo)</p>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1 ml-6 list-decimal">
              <li>Acesse <a href="https://assinador.iti.br" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">assinador.iti.br</a></li>
              <li>Faça login com seu certificado ICP-Brasil (e-CPF ou e-CRM)</li>
              <li>Faça upload do PDF gerado pelo app</li>
              <li>Assine e baixe o documento com validade legal</li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={() => window.open("https://assinador.iti.br", "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir Assinador ITI
            </Button>
          </div>

          {/* Option 2 - Adobe */}
          <div className="glass-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm font-semibold">Opção 2 — Adobe Acrobat Reader (gratuito)</p>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1 ml-6 list-decimal">
              <li>Abra o PDF no Adobe Acrobat Reader</li>
              <li>Clique em "Ferramentas" → "Certificados" → "Assinar digitalmente"</li>
              <li>Selecione seu certificado ICP-Brasil instalado no computador</li>
              <li>Salve o documento assinado</li>
            </ol>
          </div>

          {/* Option 3 - No certificate */}
          <div className="glass-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-sm font-semibold">Ainda não tenho certificado ICP-Brasil</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você pode emitir seu certificado e-CPF ou e-CRM em uma Autoridade Certificadora credenciada como{" "}
              <strong className="text-foreground">Serasa</strong>,{" "}
              <strong className="text-foreground">Certisign</strong> ou pelos{" "}
              <strong className="text-foreground">Correios</strong>.
              O custo é a partir de R$ 120 por 1 a 3 anos e é um investimento único.
            </p>
          </div>

          {/* Upload signed document */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-semibold text-center">
              📤 Já assinou o documento? Envie o PDF assinado:
            </p>

            {uploaded ? (
              <div className="glass-card p-4 text-center space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mx-auto">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold">Documento assinado salvo!</p>
                <p className="text-xs text-muted-foreground">
                  O documento foi salvo no histórico do paciente.
                </p>
              </div>
            ) : (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleUploadSigned}
                />
                <Button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  variant="outline"
                  className="w-full gap-2 font-semibold"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Enviando..." : "Enviar PDF assinado"}
                </Button>
              </>
            )}
          </div>

          <Button variant="ghost" onClick={handleClose} className="w-full text-muted-foreground text-sm">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SigningInstructionsModal;
