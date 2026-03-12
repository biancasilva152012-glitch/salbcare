import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Scale, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const statusMap: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  scheduled: { label: "Agendada", icon: Calendar, className: "text-blue-400 bg-blue-400/10" },
  completed: { label: "Concluída", icon: CheckCircle, className: "text-success bg-success/10" },
  cancelled: { label: "Cancelada", icon: XCircle, className: "text-destructive bg-destructive/10" },
};

const LegalDashboardTab = () => {
  const { user } = useAuth();

  const { data: consultations = [] } = useQuery({
    queryKey: ["legal_consultations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("legal_consultations")
        .select("*, lawyers(*)")
        .eq("user_id", user!.id)
        .order("date", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const today = format(new Date(), "yyyy-MM-dd");

  const { upcoming, past } = useMemo(() => {
    const upcoming = consultations.filter((c) => c.date >= today && c.status === "scheduled");
    const past = consultations.filter((c) => c.date < today || c.status !== "scheduled");
    return { upcoming, past };
  }, [consultations, today]);

  const ConsultationCard = ({ c }: { c: typeof consultations[0] }) => {
    const st = statusMap[c.status] || statusMap.scheduled;
    const Icon = st.icon;
    const lawyer = c.lawyers as any;
    return (
      <div className="glass-card p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{lawyer?.name || "Advogado"}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(c.date + "T12:00:00").toLocaleDateString("pt-BR")} às {c.time?.substring(0, 5)}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${st.className}`}>
          <Icon className="h-3 w-3" />
          {st.label}
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="glass-card p-3 text-center">
          <Calendar className="mx-auto h-4 w-4 text-blue-400 mb-1" />
          <p className="text-xs text-muted-foreground">Próximas</p>
          <p className="text-sm font-bold text-blue-400">{upcoming.length}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <CheckCircle className="mx-auto h-4 w-4 text-success mb-1" />
          <p className="text-xs text-muted-foreground">Realizadas</p>
          <p className="text-sm font-bold text-success">{past.filter((c) => c.status === "completed").length}</p>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Próximas Consultas</p>
          <div className="space-y-2">
            {upcoming.map((c) => <ConsultationCard key={c.id} c={c} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Histórico</p>
          <div className="space-y-2">
            {past.map((c) => <ConsultationCard key={c.id} c={c} />)}
          </div>
        </div>
      )}

      {consultations.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma consulta jurídica agendada</p>
      )}
    </motion.div>
  );
};

export default LegalDashboardTab;
