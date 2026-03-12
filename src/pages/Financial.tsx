import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Financial = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newT, setNewT] = useState({ description: "", amount: "", type: "income" as "income" | "expense", date: "" });

  const { data: transactions = [] } = useQuery({
    queryKey: ["financial", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("financial_transactions").select("*").eq("user_id", user!.id).order("date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("financial_transactions").insert({
        user_id: user!.id,
        description: newT.description,
        amount: Number(newT.amount),
        type: newT.type,
        date: newT.date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      setNewT({ description: "", amount: "", type: "income", date: "" });
      setOpen(false);
      toast.success("Transação adicionada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const profit = totalIncome - totalExpense;

  return (
    <PageContainer>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary gap-1"><Plus className="h-4 w-4" /> Novo</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5"><Label>Descrição</Label><Input placeholder="Ex: Consulta particular" value={newT.description} onChange={(e) => setNewT({ ...newT, description: e.target.value })} className="bg-accent border-border" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Valor (R$)</Label><Input type="number" placeholder="0,00" value={newT.amount} onChange={(e) => setNewT({ ...newT, amount: e.target.value })} className="bg-accent border-border" /></div>
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={newT.type} onValueChange={(v) => setNewT({ ...newT, type: v as "income" | "expense" })}>
                      <SelectTrigger className="bg-accent border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={newT.date} onChange={(e) => setNewT({ ...newT, date: e.target.value })} className="bg-accent border-border" /></div>
                <Button onClick={() => addMutation.mutate()} className="w-full gradient-primary font-semibold" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card p-3 text-center">
            <TrendingUp className="mx-auto h-4 w-4 text-success mb-1" />
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="text-sm font-bold text-success">R$ {totalIncome.toLocaleString("pt-BR")}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <TrendingDown className="mx-auto h-4 w-4 text-destructive mb-1" />
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-sm font-bold text-destructive">R$ {totalExpense.toLocaleString("pt-BR")}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <DollarSign className="mx-auto h-4 w-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Lucro</p>
            <p className="text-sm font-bold text-primary">R$ {profit.toLocaleString("pt-BR")}</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {transactions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação encontrada</p>}
          {transactions.map((t) => (
            <div key={t.id} className="glass-card flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.type === "income" ? "bg-success/10" : "bg-destructive/10"}`}>
                  {t.type === "income" ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                {t.type === "income" ? "+" : "-"}R$ {Number(t.amount).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default Financial;
