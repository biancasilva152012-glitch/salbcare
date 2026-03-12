import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const paymentMethods = [
  { value: "pix", label: "PIX" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "cash", label: "Dinheiro" },
  { value: "bank_transfer", label: "Transferência" },
];

const emptyForm = { patient_name: "", service: "", amount: "", date: "", payment_method: "pix" };

const InvoicesTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").insert({
        user_id: user!.id,
        patient_name: form.patient_name,
        service: form.service,
        amount: Number(form.amount),
        date: form.date,
        payment_method: form.payment_method,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setForm(emptyForm);
      setOpen(false);
      toast.success("Nota fiscal gerada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Nota fiscal excluída!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isValid = form.patient_name && form.service && form.amount && form.date;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Gere notas fiscais de serviços</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary gap-1"><Plus className="h-4 w-4" /> Nova NF</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Gerar Nota Fiscal</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5"><Label>Paciente</Label><Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} className="bg-accent border-border" /></div>
              <div className="space-y-1.5"><Label>Serviço</Label><Input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="Ex: Consulta médica" className="bg-accent border-border" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Valor (R$)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-accent border-border" /></div>
                <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-accent border-border" /></div>
              </div>
              <div className="space-y-1.5">
                <Label>Forma de Pagamento</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger className="bg-accent border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => addMutation.mutate()} className="w-full gradient-primary font-semibold" disabled={!isValid || addMutation.isPending}>
                {addMutation.isPending ? "Gerando..." : "Gerar Nota Fiscal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {invoices.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma nota fiscal gerada</p>}
        {invoices.map((inv) => (
          <div key={inv.id} className="glass-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10">
                <Receipt className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">{inv.patient_name}</p>
                <p className="text-xs text-muted-foreground">{inv.service} • {new Date(inv.date + "T12:00:00").toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-success">R$ {Number(inv.amount).toLocaleString("pt-BR")}</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-destructive hover:text-destructive/80"><Trash2 className="h-3.5 w-3.5" /></button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir nota fiscal?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate(inv.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default InvoicesTab;
