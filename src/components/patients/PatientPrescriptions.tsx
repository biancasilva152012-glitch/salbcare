import { useState } from "react";
import { Pill, Plus, FileText, Trash2, Download, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { generatePrescriptionPdf } from "@/utils/exportPrescriptionPdf";
import { getProfessionConfig } from "@/config/professions";
import { maskCpf } from "@/utils/masks";
import { MEDICATION_TYPE_OPTIONS, type MedicationType } from "@/utils/prescriptionColors";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  patientId: string;
  patientName: string;
}

const PatientPrescriptions = ({ patientId, patientName }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [prescription, setPrescription] = useState("");
  const [manualCpf, setManualCpf] = useState("");
  const [medicationType, setMedicationType] = useState<MedicationType>("common");

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

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["patient-prescriptions", patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("digital_documents")
        .select("*")
        .eq("patient_id", patientId)
        .eq("user_id", user!.id)
        .eq("document_type", "prescription")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && !!patientId,
  });

  const config = getProfessionConfig(profile?.professional_type || "medico");
  const councilNumber = profile?.council_number || profile?.crm || "";
  const hasCouncil = !!councilNumber;
  const patientCpf = patient?.cpf || "";

  const generateAndSave = useMutation({
    mutationFn: async () => {
      if (!prescription.trim()) throw new Error("empty");
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

      // Auto-detect dental type
      const effectiveType = profile?.professional_type === "dentista" && medicationType === "common"
        ? "dental" as MedicationType
        : medicationType;

      // Save CPF to patient if entered manually
      if (!patientCpf && cpfToUse) {
        await supabase.from("patients").update({ cpf: cpfToUse }).eq("id", patientId);
        queryClient.invalidateQueries({ queryKey: ["patient-detail", patientId] });
      }

      const doc = await generatePrescriptionPdf({
        doctorName: profile?.name || "",
        professionalType: profile?.professional_type || "medico",
        doctorCrm: councilNumber,
        doctorCouncilState: profile?.council_state || undefined,
        patientName,
        patientCpf: cpfToUse || undefined,
        prescription,
        certificate: "",
        notes: "",
        officeAddress: profile?.office_address || undefined,
        medicationType: effectiveType,
        hashCode,
      });

      const pdfBlob = doc.output("blob");
      const fileName = `receita-${patientName.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
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
        document_type: "prescription",
        hash_code: hashCode,
        file_path: filePath,
        council_number: councilNumber || null,
        council_state: profile?.council_state || null,
        metadata: { prescription_text: prescription, medication_type: effectiveType },
      });
      if (dbError) throw dbError;

      doc.save(fileName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-prescriptions", patientId] });
      setPrescription("");
      setManualCpf("");
      setMedicationType("common");
      setOpen(false);
      toast.success("Receita gerada com sucesso!");
    },
    onError: (e: any) => {
      if (e.message === "empty") {
        toast.error("Preencha os medicamentos e posologia.");
        return;
      }
      if (e.message === "no_council") {
        toast.error(`Cadastre seu número de registro profissional em Meu Perfil (${config.councilPrefix}) antes de gerar a receita.`);
        return;
      }
      toast.error("Erro ao gerar receita. Tente novamente.");
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
      queryClient.invalidateQueries({ queryKey: ["patient-prescriptions", patientId] });
      toast.success("Receita excluída!");
    },
    onError: () => toast.error("Erro ao excluir receita."),
  });

  const handleDownload = async (filePath: string | null, docName: string) => {
    if (!filePath) return;
    const { data, error } = await supabase.storage.from("prescriptions").download(filePath);
    if (error) {
      toast.error("Erro ao baixar receita.");
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = docName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activePrescriptions = prescriptions.filter(
    (p) => !(p.metadata as any)?.deleted
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            Receita Digital {activePrescriptions.length > 0 && `(${activePrescriptions.length})`}
          </span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-7">
              <Plus className="h-3.5 w-3.5" /> Nova Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Nova {config.prescriptionTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              {!hasCouncil && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Cadastre seu número de registro profissional em Meu Perfil ({config.councilPrefix}) antes de gerar a receita.
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

              {/* Medication type selector */}
              <div className="space-y-1.5">
                <Label>Tipo de medicamento</Label>
                <Select value={medicationType} onValueChange={(v) => setMedicationType(v as MedicationType)}>
                  <SelectTrigger className="bg-accent border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICATION_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(medicationType === "red_stripe" || medicationType === "black_stripe") && (
                  <p className="text-[10px] text-amber-600 font-medium">
                    ⚠ Receitas de medicamentos controlados não substituem a receita física exigida pela ANVISA.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Medicamentos e Posologia</Label>
                <Textarea
                  placeholder={config.prescriptionPlaceholder}
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  className="bg-accent border-border min-h-[120px]"
                  rows={6}
                />
              </div>
              <div className="text-sm rounded-lg bg-accent p-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Data de emissão:</span>{" "}
                <span className="text-sm font-medium">{format(new Date(), "dd/MM/yyyy")}</span>
              </div>
              <Button
                onClick={() => generateAndSave.mutate()}
                className="w-full gradient-primary font-semibold gap-2"
                disabled={generateAndSave.isPending || !hasCouncil}
              >
                <FileText className="h-4 w-4" />
                {generateAndSave.isPending ? "Gerando..." : "Gerar PDF da Receita"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activePrescriptions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma receita gerada para este paciente.
        </p>
      ) : (
        <div className="space-y-1.5">
          {activePrescriptions.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-md bg-accent/50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">
                    {config.prescriptionTitle} — {patientName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDownload(doc.file_path, `receita-${patientName}.pdf`)}
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
                      <AlertDialogTitle>Excluir receita?</AlertDialogTitle>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptions;
