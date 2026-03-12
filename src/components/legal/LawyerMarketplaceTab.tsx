import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Star, Scale } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const LawyerMarketplaceTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bookingLawyer, setBookingLawyer] = useState<any>(null);
  const [form, setForm] = useState({ date: "", time: "" });

  const { data: lawyers = [] } = useQuery({
    queryKey: ["lawyers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lawyers")
        .select("*")
        .order("rating", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("legal_consultations").insert({
        user_id: user!.id,
        lawyer_id: bookingLawyer.id,
        date: form.date,
        time: form.time,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal_consultations"] });
      setBookingLawyer(null);
      setForm({ date: "", time: "" });
      toast.success("Consulta agendada com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isValid = form.date && form.time;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <p className="text-sm text-muted-foreground">Advogados especializados em direito da saúde</p>

      {lawyers.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum advogado disponível</p>}

      {lawyers.map((l) => (
        <div key={l.id} className="glass-card p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{l.name}</h3>
                <p className="text-xs text-muted-foreground">{l.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{Number(l.rating).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({l.reviews_count})</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-primary">R$ {Number(l.consultation_price).toLocaleString("pt-BR")}</span>
              <span className="text-xs text-muted-foreground">/consulta</span>
            </div>
            <Button onClick={() => { setBookingLawyer(l); setForm({ date: "", time: "" }); }} size="sm" className="gradient-primary">
              Agendar
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={!!bookingLawyer} onOpenChange={(v) => { if (!v) setBookingLawyer(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Agendar Consulta</DialogTitle>
          </DialogHeader>
          {bookingLawyer && (
            <div className="space-y-3 pt-2">
              <div className="glass-card p-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                  <Scale className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{bookingLawyer.name}</p>
                  <p className="text-xs text-muted-foreground">{bookingLawyer.specialty} • R$ {Number(bookingLawyer.consultation_price).toLocaleString("pt-BR")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-accent border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label>Horário</Label>
                  <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="bg-accent border-border" />
                </div>
              </div>
              <Button onClick={() => bookMutation.mutate()} className="w-full gradient-primary font-semibold" disabled={!isValid || bookMutation.isPending}>
                {bookMutation.isPending ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default LawyerMarketplaceTab;
