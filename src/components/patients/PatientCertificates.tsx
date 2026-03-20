import { useState } from "react";
import { Award, Plus, FileText, Trash2, Download, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { generatePrescriptionPdf } from "@/utils/exportPrescriptionPdf";
import { getProfessionConfig } from "@/config/professions";
import { maskCpf } from "@/utils/masks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  patientId: string;
  patientName: string;
}

const PatientCertificates = ({ patientId, patientName }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [reason, setReason] = useState("");
  const [manualCpf, setManualCpf] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, professional_type, crm, council_number, council_state, office_address")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: patient } = useQuery({
    queryKey: ["patient-detail", patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("patients")
        .select("cpf")
        .eq("id", patientId)
        .single();
      return data;
    },
    enabled: !!patientId,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["patient-certificates", patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("digital_documents")
        .select("*")
        .eq("patient_id", patientId)
        .eq("user_id", user!.id)
        .eq("document_type", "certificate")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && !!patientId,
  });

  const config = getProfessionConfig(profile?.professional_type || "medico");
  const councilNumber = profile?.council_number || profile?.crm || "";
  const hasCouncil = !!councilNumber;
  const patientCpf = patient?.cpf || "";

  const buildCertificateText = () => {
    const daysNum = parseInt(days) || 0;
    const dateStr = format(startDate, "dd/MM/yyyy");
    const cidText = reason ? ` CID: ${reason}.` : "";
    return `Atesto para os devidos fins que o(a) paciente ${patientName} necessita de afastamento de suas atividades pelo período de ${daysNum} (${numberToWords(daysNum)}) dia(s), a partir de ${dateStr}.${cidText}`;
  };

  const generateAndSave = useMutation({
    mutationFn: async () => {
      if (!days || parseInt(days) <= 0) throw new Error("empty");
      if (!hasCouncil) throw new Error("no_council");

      const cpfToUse = patientCpf || manualCpf;

      const hashInput = `${profile?.name}|${councilNumber}|${patientName}|${Date.now()}`;
      let hash = 0;
      for (let i = 0; i < hashInput.length; i++) {
        hash = ((hash << 5) - hash) + hashInput.charCodeAt(i);
        hash = hash & hash;
      }
      const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
      const hashCode = `SALB-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${Date.now().toString(36).toUpperCase().slice(-4)}`;

      // Save CPF if entered manually
      if (!patientCpf && cpfToUse) {
        await supabase.from("patients").update({ cpf: cpfToUse }).eq("id", patientId);
        queryClient.invalidateQueries({ queryKey: ["patient-detail", patientId] });
      }

      const certificateText = buildCertificateText();

      const doc = generatePrescriptionPdf({
        doctorName: profile?.name || "",
        professionalType: profile?.professional_type || "medico",
        doctorCrm: councilNumber,
        doctorCouncilState: profile?.council_state || undefined,
        patientName,
        patientCpf: cpfToUse || undefined,
        prescription: "",
        certificate: certificateText,
        notes: "",
        officeAddress: profile?.office_address || undefined,
      });

      const pdfBlob = doc.output("blob");
      const fileName = `atestado-${patientName.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      const filePath = `${user!.id}/${patientId}/${Date.now()}-${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(filePath, pdfBlob, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("digital_documents").insert({
        user_id: user!.id,
        patient_id: patientId,
        patient_name: patientName,
        professional_name: profile?.name || "",
        professional_type: profile?.professional_type || "medico",
        document_type: "certificate",
        hash_code: hashCode,
        file_path: filePath,
        council_number: councilNumber || null,
        council_state: profile?.council_state || null,
        metadata: { days: parseInt(days), start_date: format(startDate, "yyyy-MM-dd"), reason },
      });
      if (dbError) throw dbError;

      doc.save(fileName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-certificates", patientId] });
      setDays("");
      setStartDate(new Date());
      setReason("");
      setManualCpf("");
      setOpen(false);
      toast.success("Atestado gerado com sucesso!");
    },
    onError: (e: any) => {
      if (e.message === "empty") {
        toast.error("Informe o número de dias de afastamento.");
        return;
      }
      if (e.message === "no_council") {
        toast.error(`Cadastre seu número de registro profissional (${config.councilPrefix}) no perfil antes de gerar o atestado.`);
        return;
      }
      toast.error("Erro ao gerar atestado. Tente novamente.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: { id: string; file_path: string | null }) => {
      if (doc.file_path) {
        await supabase.storage.from("prescriptions").remove([doc.file_path]);
      }
      const { error } = await supabase.from("digital_documents").update({
        metadata: { deleted: true },
      }).eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-certificates", patientId] });
      toast.success("Atestado excluído!");
    },
    onError: () => toast.error("Erro ao excluir atestado."),
  });

  const handleDownload = async (filePath: string | null, docName: string) => {
    if (!filePath) return;
    const { data, error } = await supabase.storage.from("prescriptions").download(filePath);
    if (error) {
      toast.error("Erro ao baixar atestado.");
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = docName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCertificates = certificates.filter(
    (c) => !(c.metadata as any)?.deleted
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            Atestado Digital {activeCertificates.length > 0 && `(${activeCertificates.length})`}
          </span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-7">
              <Plus className="h-3.5 w-3.5" /> Novo Atestado
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Novo {config.certificateTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              {!hasCouncil && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Cadastre seu número de registro profissional ({config.councilPrefix}) no perfil antes de gerar o atestado.
                  </AlertDescription>
                </Alert>
              )}
              <div className="text-sm rounded-lg bg-accent p-3">
                <span className="text-xs text-muted-foreground">Paciente:</span>{" "}
                <span className="font-medium">{patientName}</span>
                {patientCpf && (
                  <p className="text-xs text-muted-foreground mt-1">CPF: {patientCpf}</p>
                )}
              </div>
              {!patientCpf && (
                <div className="space-y-1.5">
                  <Label>CPF do Paciente</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={manualCpf}
                    onChange={(e) => setManualCpf(maskCpf(e.target.value))}
                    className="bg-accent border-border"
                    maxLength={14}
                  />
                  <p className="text-[10px] text-muted-foreground">Será salvo no cadastro do paciente.</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Dias de afastamento</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ex: 3"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="bg-accent border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data de início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-accent border-border"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(startDate, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => d && setStartDate(d)}
                      locale={ptBR}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Motivo / CID (opcional)</Label>
                <Textarea
                  placeholder="Ex: J06 - IVAS, ou deixe em branco"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="bg-accent border-border"
                  rows={2}
                />
              </div>
              <Button
                onClick={() => generateAndSave.mutate()}
                className="w-full gradient-primary font-semibold gap-2"
                disabled={generateAndSave.isPending || !hasCouncil}
              >
                <FileText className="h-4 w-4" />
                {generateAndSave.isPending ? "Gerando..." : "Gerar PDF do Atestado"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activeCertificates.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhum atestado gerado para este paciente.
        </p>
      ) : (
        <div className="space-y-1.5">
          {activeCertificates.map((doc) => {
            const meta = doc.metadata as any;
            const daysText = meta?.days ? `${meta.days} dia(s)` : "";
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-md bg-accent/50 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Award className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {config.certificateTitle} {daysText && `— ${daysText}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDownload(doc.file_path, `atestado-${patientName}.pdf`)}
                    className="p-1 text-primary hover:text-primary/80"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-1 text-destructive hover:text-destructive/80">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir atestado?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate({ id: doc.id, file_path: doc.file_path })}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** Simple number-to-words for small numbers in Portuguese */
function numberToWords(n: number): string {
  const units = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez",
    "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove", "vinte"];
  if (n >= 0 && n <= 20) return units[n];
  if (n <= 30) return `vinte e ${units[n - 20]}`;
  return String(n);
}

export default PatientCertificates;
