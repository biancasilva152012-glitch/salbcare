import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PatientDocumentsTab = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["patient-profile-email", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("email, name").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["patient-documents-received", user?.id, profile?.name],
    queryFn: async () => {
      if (!profile?.name) return [];
      const { data } = await supabase
        .from("digital_documents")
        .select("*")
        .ilike("patient_name", `%${profile.name}%`)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && !!profile?.name,
  });

  const handleDownload = async (doc: any) => {
    if (!doc.file_path) {
      toast.error("Arquivo não disponível.");
      return;
    }
    try {
      const { data } = await supabase.storage.from("prescriptions").createSignedUrl(doc.file_path, 300);
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      } else {
        toast.error("Não foi possível gerar o link de download.");
      }
    } catch {
      toast.error("Erro ao baixar documento.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Você ainda não recebeu nenhum documento.</p>
        <p className="text-xs text-muted-foreground">Receitas e atestados emitidos pelos seus profissionais aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {documents.length} documento{documents.length !== 1 ? "s" : ""} recebido{documents.length !== 1 ? "s" : ""}
      </p>

      {documents.map((doc: any) => {
        const date = new Date(doc.created_at);
        const typeLabel = doc.document_type === "prescription" ? "Receita Digital" : "Atestado Digital";
        const typeEmoji = doc.document_type === "prescription" ? "💊" : "📋";

        return (
          <div key={doc.id} className="glass-card p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <span>{typeEmoji}</span> {typeLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {doc.professional_name}
                  {doc.council_number && ` — ${doc.council_number}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {date.toLocaleDateString("pt-BR")}
                </p>
                {doc.signed_icp && (
                  <span className="text-[10px] text-primary font-medium">✅ Assinado ICP</span>
                )}
              </div>
            </div>

            {doc.hash_code && (
              <p className="text-[10px] font-mono text-muted-foreground">
                Código: {doc.hash_code}
              </p>
            )}

            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2 text-xs"
              onClick={() => handleDownload(doc)}
            >
              <Download className="h-3.5 w-3.5" />
              Baixar documento
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default PatientDocumentsTab;
