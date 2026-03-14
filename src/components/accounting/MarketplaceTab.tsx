import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const MarketplaceTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: partners = [] } = useQuery({
    queryKey: ["accounting_partners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("accounting_partners")
        .select("*")
        .order("rating", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: hires = [] } = useQuery({
    queryKey: ["partner_hires", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("partner_hires")
        .select("partner_id")
        .eq("user_id", user!.id);
      return (data || []).map((h) => h.partner_id);
    },
    enabled: !!user,
  });

  const hireMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase.from("partner_hires").insert({
        user_id: user!.id,
        partner_id: partnerId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_hires"] });
      toast.success("Parceiro contratado com sucesso!");
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <p className="text-sm text-muted-foreground">Encontre parceiros contábeis especializados em saúde</p>
      {partners.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum parceiro disponível</p>}
      {partners.map((p) => (
        <div key={p.id} className="glass-card p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{p.company_name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{p.specialty}</p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{Number(p.rating).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({p.reviews_count})</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-primary">R$ {Number(p.monthly_price).toLocaleString("pt-BR")}</span>
              <span className="text-xs text-muted-foreground">/mês</span>
            </div>
            {hires.includes(p.id) ? (
              <div className="flex items-center gap-1 text-success text-sm font-medium">
                <CheckCircle className="h-4 w-4" /> Contratado
              </div>
            ) : (
              <Button onClick={() => hireMutation.mutate(p.id)} size="sm" className="gradient-primary" disabled={hireMutation.isPending}>
                Contratar
              </Button>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default MarketplaceTab;
