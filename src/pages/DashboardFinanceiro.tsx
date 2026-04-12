import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DashboardFinanceiro = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", date: format(new Date(), "yyyy-MM-dd"), description: "" });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const monthKey = format(startOfMonth, "yyyy-MM");

  const { data: transactions = [] } = useQuery({
    queryKey: ["income-transactions", user?.id, monthKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("financial_transactions")
        .select("id, amount, date, description, created_at")
        .eq("user_id", user!.id)
        .eq("type", "income")
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .order("date", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  const totalIncome = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("financial_transactions").insert({
        user_id: user!.id,
        amount: parseFloat(form.amount),
        type: "income",
        date: form.date,
        description: form.description || "Recebimento",
        category: "consulta",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-income"] });
      toast.success("Recebimento registrado!");
      setForm({ amount: "", date: format(new Date(), "yyyy-MM-dd"), description: "" });
      setOpen(false);
    },
    onError: () => toast.error("Erro ao registrar."),
  });

  const monthName = format(startOfMonth, "MMMM", { locale: ptBR });

  return (
    <PageContainer backTo="/dashboard">
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total recebido em {monthName}</p>
          <p className="text-4xl font-bold text-primary">
            R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2 gradient-primary font-semibold">
              <Plus className="h-4 w-4" /> Registrar recebimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo recebimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nota (opcional)</Label>
                <Textarea
                  placeholder="Ex: Consulta particular"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!form.amount || parseFloat(form.amount) <= 0 || addMutation.isPending}
                className="w-full gradient-primary font-semibold"
              >
                {addMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transactions list */}
        <div className="space-y-2">
          {transactions.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum recebimento registrado este mês
            </p>
          )}
          {transactions.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card flex items-center justify-between p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{t.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className="text-sm font-bold text-primary shrink-0 ml-2">
                R$ {Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default DashboardFinanceiro;
