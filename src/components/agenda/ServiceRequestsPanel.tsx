import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FilePlus, FileText, Stethoscope, Clock, Check, X, Eye,
  Loader2, Phone, Mail, MapPin, User, Pill, AlertCircle, FileImage, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

type ServiceRequest = {
  id: string;
  professional_id: string;
  service_type: string;
  status: string;
  payment_status: string;
  patient_name: string | null;
  patient_cpf: string | null;
  patient_email: string | null;
  patient_phone: string | null;
  patient_address: string | null;
  patient_birth_date: string | null;
  prescription_data: any;
  prescription_image_path: string | null;
  receipt_url: string | null;
  consultation_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const SERVICE_TYPE_CONFIG: Record<string, { label: string; icon: typeof FilePlus; color: string }> = {
  prescription_renewal: { label: "Renovação de Receita", icon: FilePlus, color: "text-primary" },
  certificate: { label: "Atestado Médico", icon: FileText, color: "text-amber-500" },
  consultation: { label: "Consulta Online", icon: Stethoscope, color: "text-blue-500" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_payment: { label: "Aguardando Pagamento", variant: "outline" },
  pending_review: { label: "Aguardando Análise", variant: "secondary" },
  in_progress: { label: "Em Andamento", variant: "default" },
  completed: { label: "Concluído", variant: "default" },
  rejected: { label: "Recusado", variant: "destructive" },
};

const ServiceRequestsPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("actionable");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["service-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("professional_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ServiceRequest[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("service_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success(status === "in_progress" ? "Solicitação aceita!" : "Solicitação recusada.");
      setDetailOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar solicitação."),
  });

  const handleAction = async (id: string, action: "accept" | "reject") => {
    setProcessingId(id);
    const status = action === "accept" ? "in_progress" : "rejected";
    await updateStatusMutation.mutateAsync({ id, status });
    setProcessingId(null);
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === "actionable") return r.status === "pending_review" || r.status === "pending_payment";
    if (filterStatus === "active") return r.status === "in_progress";
    if (filterStatus === "completed") return r.status === "completed" || r.status === "rejected";
    return true;
  });

  const actionableCount = requests.filter(
    (r) => r.status === "pending_review"
  ).length;

  const openDetail = (req: ServiceRequest) => {
    setSelectedRequest(req);
    setDetailOpen(true);
  };

  const getReceiptUrl = (path: string | null) => {
    if (!path) return null;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/payment-receipts/${path}`;
  };

  const getPrescriptionImageUrl = (path: string | null) => {
    if (!path) return null;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/prescription-uploads/${path}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { key: "actionable", label: "Pendentes", count: actionableCount },
          { key: "active", label: "Em andamento" },
          { key: "completed", label: "Finalizados" },
          { key: "all", label: "Todos" },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors relative ${
              filterStatus === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {label}
            {count != null && count > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request list */}
      {filteredRequests.length === 0 && (
        <EmptyState
          icon={FilePlus}
          title="Nenhuma solicitação"
          description={
            filterStatus === "actionable"
              ? "Você não tem solicitações pendentes no momento."
              : "Nenhuma solicitação encontrada com este filtro."
          }
        />
      )}

      <div className="space-y-2">
        {filteredRequests.map((req) => {
          const config = SERVICE_TYPE_CONFIG[req.service_type] || SERVICE_TYPE_CONFIG.prescription_renewal;
          const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending_payment;
          const Icon = config.icon;
          const createdDate = new Date(req.created_at);

          return (
            <div
              key={req.id}
              className={`glass-card p-3 space-y-2 cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all ${
                req.status === "pending_review" ? "ring-1 ring-amber-500/20" : ""
              }`}
              onClick={() => openDetail(req)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium truncate">{req.patient_name || "Paciente"}</p>
                      <Badge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0">
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={config.color}>{config.label}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      {format(createdDate, "dd/MM HH:mm", { locale: ptBR })}
                    </div>
                    {req.consultation_price != null && req.consultation_price > 0 && (
                      <p className="text-[11px] text-primary font-medium mt-0.5">
                        R$ {req.consultation_price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="shrink-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick actions for pending_review */}
              {req.status === "pending_review" && (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={processingId === req.id}
                    onClick={() => handleAction(req.id, "accept")}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {processingId === req.id ? "..." : "Aceitar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                    disabled={processingId === req.id}
                    onClick={() => handleAction(req.id, "reject")}
                  >
                    <X className="h-3.5 w-3.5" />
                    Recusar
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequest && (() => {
                const config = SERVICE_TYPE_CONFIG[selectedRequest.service_type] || SERVICE_TYPE_CONFIG.prescription_renewal;
                const Icon = config.icon;
                return (
                  <>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    {config.label}
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 pt-2">
              {/* Status badge */}
              <div className="flex items-center justify-between">
                <Badge variant={STATUS_CONFIG[selectedRequest.status]?.variant || "outline"} className="text-xs">
                  {STATUS_CONFIG[selectedRequest.status]?.label || selectedRequest.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(selectedRequest.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              {/* Patient info */}
              <div className="rounded-lg border border-border p-3 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados do Paciente</h3>
                {selectedRequest.patient_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.patient_name}</span>
                  </div>
                )}
                {selectedRequest.patient_cpf && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground text-xs">CPF:</span>
                    <span>{selectedRequest.patient_cpf}</span>
                  </div>
                )}
                {selectedRequest.patient_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`https://wa.me/55${selectedRequest.patient_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selectedRequest.patient_phone}
                    </a>
                  </div>
                )}
                {selectedRequest.patient_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.patient_email}</span>
                  </div>
                )}
                {selectedRequest.patient_address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs">{selectedRequest.patient_address}</span>
                  </div>
                )}
                {selectedRequest.patient_birth_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground text-xs">Nasc.:</span>
                    <span>{format(new Date(selectedRequest.patient_birth_date + "T12:00:00"), "dd/MM/yyyy")}</span>
                  </div>
                )}
              </div>

              {/* Prescription data */}
              {selectedRequest.service_type === "prescription_renewal" && selectedRequest.prescription_data && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Pill className="h-3.5 w-3.5" /> Medicamentos
                  </h3>
                  {(() => {
                    const data = selectedRequest.prescription_data as any;
                    const meds = data?.medications || [];
                    return meds.length > 0 ? (
                      <div className="space-y-1.5">
                        {meds.map((med: any, i: number) => (
                          <div key={i} className="rounded bg-accent/50 px-3 py-2 text-sm">
                            <span className="font-medium">{med.name || "—"}</span>
                            {med.dosage && <span className="text-muted-foreground"> • {med.dosage}</span>}
                            {med.posology && <span className="text-muted-foreground"> • {med.posology}</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhum medicamento informado.</p>
                    );
                  })()}
                  {(() => {
                    const data = selectedRequest.prescription_data as any;
                    return (
                      <>
                        {data?.prevDoctorName && (
                          <p className="text-xs text-muted-foreground">
                            Médico anterior: <span className="text-foreground">{data.prevDoctorName}</span>
                            {data?.prevDoctorCrm && ` (CRM: ${data.prevDoctorCrm})`}
                          </p>
                        )}
                        {data?.isContinuousUse && (
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Uso contínuo</Badge>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Prescription image */}
              {selectedRequest.prescription_image_path && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <FileImage className="h-3.5 w-3.5" /> Foto da Receita Anterior
                  </h3>
                  <a
                    href={getPrescriptionImageUrl(selectedRequest.prescription_image_path) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-2 text-xs text-primary hover:bg-accent transition-colors"
                  >
                    <FileImage className="h-4 w-4" />
                    Ver imagem da receita
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </div>
              )}

              {/* Certificate details */}
              {selectedRequest.service_type === "certificate" && selectedRequest.notes && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detalhes do Atestado</h3>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Payment receipt */}
              {selectedRequest.receipt_url && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comprovante de Pagamento</h3>
                  <a
                    href={getReceiptUrl(selectedRequest.receipt_url) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-2 text-xs text-primary hover:bg-accent transition-colors"
                  >
                    <FileImage className="h-4 w-4" />
                    Ver comprovante
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </div>
              )}

              {/* Price */}
              {selectedRequest.consultation_price != null && selectedRequest.consultation_price > 0 && (
                <div className="text-center py-2">
                  <span className="text-sm text-muted-foreground">Valor:</span>{" "}
                  <span className="text-lg font-bold text-primary">R$ {selectedRequest.consultation_price.toFixed(2)}</span>
                </div>
              )}

              {/* Action buttons */}
              {(selectedRequest.status === "pending_review" || selectedRequest.status === "pending_payment") && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={processingId === selectedRequest.id}
                    onClick={() => handleAction(selectedRequest.id, "accept")}
                  >
                    <Check className="h-4 w-4" />
                    {processingId === selectedRequest.id ? "Processando..." : "Aceitar Solicitação"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                    disabled={processingId === selectedRequest.id}
                    onClick={() => handleAction(selectedRequest.id, "reject")}
                  >
                    <X className="h-4 w-4" />
                    Recusar
                  </Button>
                </div>
              )}

              {selectedRequest.status === "in_progress" && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Solicitação aceita. Emita a receita ou atestado pelo painel de Pacientes e atualize o status.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-2 gradient-primary"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedRequest.id, status: "completed" });
                    }}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Marcar como Concluído
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceRequestsPanel;
