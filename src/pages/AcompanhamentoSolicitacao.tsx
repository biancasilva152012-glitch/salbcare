import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft,
  FileText, Stethoscope, FilePlus, Loader2, Copy, Phone
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any; description: string }> = {
  pending_payment: {
    label: "Aguardando Pagamento",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: Clock,
    description: "O pagamento ainda não foi confirmado.",
  },
  pending_review: {
    label: "Em Análise",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Clock,
    description: "Sua solicitação foi recebida e está sendo analisada pelo profissional.",
  },
  pending_validation: {
    label: "Validando Comprovante",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Clock,
    description: "O comprovante de pagamento está sendo verificado.",
  },
  in_progress: {
    label: "Em Atendimento",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: Stethoscope,
    description: "O profissional está preparando seu documento ou consulta.",
  },
  completed: {
    label: "Concluído",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: CheckCircle2,
    description: "Seu atendimento foi concluído! Verifique seu e-mail ou WhatsApp.",
  },
  rejected: {
    label: "Recusado",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircle,
    description: "A solicitação foi recusada pelo profissional. Entre em contato para mais informações.",
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-muted text-muted-foreground border-border",
    icon: XCircle,
    description: "Esta solicitação foi cancelada.",
  },
};

const SERVICE_LABELS: Record<string, { label: string; icon: any }> = {
  prescription_renewal: { label: "Renovação de Receita", icon: FilePlus },
  certificate: { label: "Atestado", icon: FileText },
  consultation: { label: "Consulta Online", icon: Stethoscope },
};

const AcompanhamentoSolicitacao = () => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState(paramId || "");
  const [activeId, setActiveId] = useState(paramId || "");

  const { data: request, isLoading, error, refetch } = useQuery({
    queryKey: ["track-request", activeId],
    queryFn: async () => {
      if (!activeId) return null;
      // Try full UUID or short code (first 8 chars)
      const normalizedId = activeId.trim().toLowerCase();
      
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, status, service_type, patient_name, created_at, updated_at, consultation_price, professional_id, notes")
        .or(`id.eq.${normalizedId}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        // Try matching by prefix
        const { data: prefixData, error: prefixErr } = await supabase
          .from("service_requests")
          .select("id, status, service_type, patient_name, created_at, updated_at, consultation_price, professional_id, notes")
          .ilike("id", `${normalizedId}%`)
          .limit(1)
          .maybeSingle();
        if (prefixErr) throw prefixErr;
        return prefixData;
      }

      return data;
    },
    enabled: !!activeId,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveId(searchId.trim());
  };

  const statusInfo = request ? STATUS_MAP[request.status] || STATUS_MAP.pending_review : null;
  const serviceInfo = request ? SERVICE_LABELS[request.service_type] || SERVICE_LABELS.consultation : null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Acompanhar Solicitação | SalbCare"
        description="Acompanhe o status da sua solicitação de pronto atendimento."
        canonical="/acompanhamento"
      />

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/pronto-atendimento")}
            className="p-2 rounded-lg hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Acompanhar Solicitação</h1>
            <p className="text-xs text-muted-foreground">
              Insira o código recebido ao final do atendimento
            </p>
          </div>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              placeholder="Código (ex: A1B2C3D4)"
              className="bg-accent border-border pl-9 uppercase font-mono"
              maxLength={36}
            />
          </div>
          <Button type="submit" disabled={!searchId.trim()} className="gradient-primary shrink-0">
            Buscar
          </Button>
        </form>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Not found */}
        {!isLoading && activeId && !request && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 text-center space-y-3"
          >
            <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium">Solicitação não encontrada</p>
            <p className="text-xs text-muted-foreground">
              Verifique o código e tente novamente. Use o código completo ou os 8 primeiros caracteres.
            </p>
          </motion.div>
        )}

        {/* Result */}
        {!isLoading && request && statusInfo && serviceInfo && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Status card */}
            <div className={`glass-card p-5 space-y-4 border ${statusInfo.color.split(" ").find(c => c.startsWith("border-"))}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${statusInfo.color.split(" ").slice(0, 2).join(" ")}`}>
                  <statusInfo.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <Badge className={`${statusInfo.color} text-xs px-2.5 py-1`}>
                    {statusInfo.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {statusInfo.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Details card */}
            <div className="glass-card p-5 space-y-3">
              <h2 className="text-sm font-semibold">Detalhes</h2>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Serviço</p>
                  <div className="flex items-center gap-1.5 font-medium">
                    <serviceInfo.icon className="h-3.5 w-3.5 text-primary" />
                    {serviceInfo.label}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground">Código</p>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold">{request.id.slice(0, 8).toUpperCase()}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(request.id.slice(0, 8).toUpperCase());
                        toast.success("Código copiado!");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {request.patient_name && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Paciente</p>
                    <p className="font-medium">{request.patient_name}</p>
                  </div>
                )}

                {request.consultation_price != null && Number(request.consultation_price) > 0 && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-medium">R$ {Number(request.consultation_price).toFixed(2)}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-muted-foreground">Criado em</p>
                  <p className="font-medium">
                    {new Date(request.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground">Última atualização</p>
                  <p className="font-medium">
                    {new Date(request.updated_at).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {request.notes && (
                <div className="pt-2 border-t border-border space-y-1">
                  <p className="text-xs text-muted-foreground">Observações do profissional:</p>
                  <p className="text-xs bg-accent rounded-lg p-3">{request.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()} className="flex-1 text-xs">
                🔄 Atualizar Status
              </Button>
              <Button variant="outline" onClick={() => navigate("/pronto-atendimento")} className="flex-1 text-xs">
                Nova Solicitação
              </Button>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!activeId && !isLoading && (
          <div className="text-center py-12 space-y-3">
            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Digite o código da solicitação para acompanhar o status.
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              O código foi exibido na tela de confirmação após o envio.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground/60">Powered by SALBCARE</p>
        </div>
      </div>
    </div>
  );
};

export default AcompanhamentoSolicitacao;
