import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { DollarSign, ChevronLeft, ChevronRight, Filter, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EmptyState from "@/components/EmptyState";

type PaymentStatus = "pending" | "paid" | "transferred" | "refunded";

const STATUS_CONFIG: Record<PaymentStatus, { label: string; emoji: string; className: string }> = {
  pending: { label: "Aguardando consulta", emoji: "🟡", className: "text-yellow-500" },
  paid: { label: "Pago", emoji: "🟢", className: "text-success" },
  transferred: { label: "Transferido", emoji: "🟢", className: "text-success" },
  refunded: { label: "Reembolsado", emoji: "🔴", className: "text-destructive" },
};

const ConsultationPayments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterMonth, setFilterMonth] = useState(new Date());
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const filterKey = format(filterMonth, "yyyy-MM");
  const filterLabel = format(filterMonth, "MMMM yyyy", { locale: ptBR });
  const capitalizedLabel = filterLabel.charAt(0).toUpperCase() + filterLabel.slice(1);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["consultation-payments", user?.id, filterKey],
    queryFn: async () => {
      const startDate = `${filterKey}-01`;
      const endMonth = addMonths(new Date(startDate), 1);
      const endDate = format(endMonth, "yyyy-MM-dd");

      const { data } = await supabase
        .from("consultation_payments")
        .select("*")
        .eq("doctor_id", user!.id)
        .gte("appointment_date", startDate)
        .lt("appointment_date", endDate)
        .order("appointment_date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const refundMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await supabase.functions.invoke("refund-consultation", {
        body: { payment_id: paymentId, reason: "Cancelamento pelo profissional" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation-payments"] });
      toast.success("Reembolso processado com sucesso!");
      setRefundingId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao processar reembolso.");
      setRefundingId(null);
    },
  });

  const paidPayments = payments.filter((p: any) => p.status !== "refunded");
  const totalGross = paidPayments.reduce((s: number, p: any) => s + Number(p.gross_amount), 0);

  return (
    <div className="space-y-4">
      {/* Month Filter */}
      <div className="flex items-center justify-between glass-card p-2.5">
        <button onClick={() => setFilterMonth(subMonths(filterMonth, 1))} className="p-1 rounded-md hover:bg-accent">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{capitalizedLabel}</span>
        </div>
        <button onClick={() => setFilterMonth(addMonths(filterMonth, 1))} className="p-1 rounded-md hover:bg-accent">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="glass-card p-3 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total recebido</p>
        <p className="text-sm font-bold text-success">R$ {totalGross.toFixed(2)}</p>
        <p className="text-[10px] text-muted-foreground mt-1">Você recebe 100% do valor de cada consulta.</p>
      </div>

      {/* Payment List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Nenhuma consulta paga"
          description="As consultas pagas via SALBCARE aparecerão aqui."
        />
      ) : (
        <div className="space-y-2">
          {payments.map((p: any) => {
            const status = STATUS_CONFIG[(p.status as PaymentStatus) || "pending"];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.patient_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(p.appointment_date), "dd/MM/yyyy")} às {p.appointment_time?.substring(0, 5)}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium flex items-center gap-1 ${status.className}`}>
                    {status.emoji} {status.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-border pt-2">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-semibold text-success">
                    R$ {Number(p.gross_amount).toFixed(2)}
                  </span>
                </div>

                {p.status === "paid" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1"
                    onClick={() => setRefundingId(p.id)}
                  >
                    <RefreshCw className="h-3 w-3" /> Reembolsar paciente
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Refund Confirmation Dialog */}
      <AlertDialog open={!!refundingId} onOpenChange={(v) => !v && setRefundingId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar reembolso</AlertDialogTitle>
            <AlertDialogDescription>
              O valor integral será devolvido ao paciente. A taxa da plataforma também será estornada. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => refundingId && refundMutation.mutate(refundingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={refundMutation.isPending}
            >
              {refundMutation.isPending ? "Processando..." : "Confirmar reembolso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-[10px] text-center text-muted-foreground">
        Pagamentos processados pela Stripe. Transferências em até 2 dias úteis após a consulta. A SALBCARE retém 10% como taxa de intermediação.
      </p>
    </div>
  );
};

export default ConsultationPayments;
