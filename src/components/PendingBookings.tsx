import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Clock, FileImage, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PendingBookings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: pendingBookings = [] } = useQuery({
    queryKey: ["pending-bookings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "aguardando_confirmacao")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const handleAction = async (appointmentId: string, action: "approve" | "reject") => {
    setProcessingId(appointmentId);
    try {
      const { data, error } = await supabase.functions.invoke("manage-booking", {
        body: { action, appointment_id: appointmentId },
      });
      if (error) throw error;

      toast.success(action === "approve" ? "Agendamento aprovado!" : "Agendamento recusado.");
      queryClient.invalidateQueries({ queryKey: ["pending-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
    } catch (error: any) {
      toast.error(error?.message || "Erro ao processar. Tente novamente.");
    } finally {
      setProcessingId(null);
    }
  };

  if (pendingBookings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Agendamentos pendentes
        </h2>
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
          {pendingBookings.length}
        </Badge>
      </div>

      <AnimatePresence>
        {pendingBookings.map((appt: any) => {
          const receiptUrl = appt.receipt_url
            ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/booking-receipts/${appt.receipt_url}`
            : null;

          // Parse notes to extract patient info
          const notes = appt.notes || "";
          const phoneMatch = notes.match(/Tel:\s*([^|]+)/);
          const emailMatch = notes.match(/Email:\s*([^|]+)/);
          const valorMatch = notes.match(/Valor:\s*([^|]+)/);

          return (
            <motion.div
              key={appt.id}
              layout
              exit={{ opacity: 0, height: 0 }}
              className="glass-card p-3 space-y-2 ring-1 ring-orange-500/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{appt.patient_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {appt.date ? format(new Date(appt.date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : ""} às {appt.time?.substring(0, 5)}
                  </p>
                  {phoneMatch && (
                    <p className="text-[10px] text-muted-foreground">📱 {phoneMatch[1].trim()}</p>
                  )}
                  {emailMatch && (
                    <p className="text-[10px] text-muted-foreground">✉️ {emailMatch[1].trim()}</p>
                  )}
                  {valorMatch && (
                    <p className="text-[10px] font-medium text-foreground">{valorMatch[1].trim()}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0 border-orange-500/30 text-orange-600">
                  <Clock className="h-3 w-3 mr-1" /> Pendente
                </Badge>
              </div>

              {receiptUrl && (
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-accent/50 px-3 py-2 text-xs text-primary hover:bg-accent transition-colors"
                >
                  <FileImage className="h-4 w-4" />
                  Ver comprovante
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1 bg-success hover:bg-success/90 text-white"
                  disabled={processingId === appt.id}
                  onClick={() => handleAction(appt.id, "approve")}
                >
                  <Check className="h-3.5 w-3.5" />
                  {processingId === appt.id ? "..." : "Aprovar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={processingId === appt.id}
                  onClick={() => handleAction(appt.id, "reject")}
                >
                  <X className="h-3.5 w-3.5" />
                  Recusar
                </Button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default PendingBookings;
