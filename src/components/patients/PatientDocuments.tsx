import { useState } from "react";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PatientDocumentsProps {
  patientId: string;
}

const PatientDocuments = ({ patientId }: PatientDocumentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");

  const { data: documents = [] } = useQuery({
    queryKey: ["patient-documents", patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("patient_documents")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: { id: string; file_path: string }) => {
      await supabase.storage.from("patient-documents").remove([doc.file_path]);
      const { error } = await supabase.from("patient_documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-documents", patientId] });
      toast.success("Documento excluído!");
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande (máx. 10MB)");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${patientId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("patient-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("patient_documents").insert({
        patient_id: patientId,
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        description: description || null,
      });
      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ["patient-documents", patientId] });
      setDescription("");
      toast.success("Documento enviado!");
    } catch {
      toast.error("Não conseguimos salvar. Tente de novo em instantes.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("patient-documents")
      .download(filePath);
    if (error) {
      toast.error("Não conseguimos baixar o arquivo. Tente de novo.");
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Documentos
      </h3>

      {/* Upload area */}
      <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Descrição (opcional)</Label>
          <Input
            placeholder="Ex: Exame de sangue, Raio-X..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-accent border-border text-sm h-8"
          />
        </div>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-medium text-primary hover:bg-accent/80 transition-colors">
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Enviando..." : "Enviar documento (PDF, imagem)"}
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          Nenhum documento anexado
        </p>
      ) : (
        <div className="space-y-1.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-md bg-accent/50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{doc.file_name}</p>
                  {doc.description && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDownload(doc.file_path, doc.file_name)}
                  className="p-1 text-primary hover:text-primary/80"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate({ id: doc.id, file_path: doc.file_path })}
                  className="p-1 text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientDocuments;
