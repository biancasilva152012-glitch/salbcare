import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Clock, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const statusMap: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  analysis: { label: "Em análise", icon: Clock, className: "text-yellow-400 bg-yellow-400/10" },
  in_progress: { label: "Em andamento", icon: Loader2, className: "text-blue-400 bg-blue-400/10" },
  completed: { label: "Concluído", icon: CheckCircle, className: "text-success bg-success/10" },
};

const emptyForm = { name: "", cpf: "", profession: "", city: "", documents: "" };

const CnpjRequestTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: requests = [] } = useQuery({
    queryKey: ["cnpj_requests", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("cnpj_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cnpj_requests").insert({
        user_id: user!.id,
        name: form.name,
        cpf: form.cpf,
        profession: form.profession,
        city: form.city,
        documents: form.documents,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cnpj_requests"] });
      setForm(emptyForm);
      setOpen(false);
      toast.success("Solicitação enviada com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isValid = form.name && form.cpf && form.profession && form.city;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Solicite a abertura do seu CNPJ</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary gap-1"><Plus className="h-4 w-4" /> Nova Solicitação</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Abertura de CNPJ</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5"><Label>Nome completo</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent border-border" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" className="bg-accent border-border" /></div>
                <div className="space-y-1.5"><Label>Profissão</Label><Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} className="bg-accent border-border" /></div>
              </div>
              <div className="space-y-1.5"><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-accent border-border" /></div>
              <div className="space-y-1.5"><Label>Documentos (observações)</Label><Input value={form.documents} onChange={(e) => setForm({ ...form, documents: e.target.value })} placeholder="Ex: RG, comprovante de endereço..." className="bg-accent border-border" /></div>
              <Button onClick={() => addMutation.mutate()} className="w-full gradient-primary font-semibold" disabled={!isValid || addMutation.isPending}>
                {addMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {requests.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma solicitação ainda</p>}
        {requests.map((r) => {
          const st = statusMap[r.status] || statusMap.analysis;
          const Icon = st.icon;
          return (
            <div key={r.id} className="glass-card p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.profession} • {r.city}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${st.className}`}>
                <Icon className="h-3 w-3" />
                {st.label}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default CnpjRequestTab;
