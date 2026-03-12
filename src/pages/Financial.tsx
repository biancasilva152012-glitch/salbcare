import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageContainer from "@/components/PageContainer";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
}

const initialTransactions: Transaction[] = [
  { id: 1, description: "Consulta - Maria Santos", amount: 350, type: "income", date: "2026-03-12" },
  { id: 2, description: "Consulta - João Oliveira", amount: 250, type: "income", date: "2026-03-11" },
  { id: 3, description: "Aluguel consultório", amount: 2500, type: "expense", date: "2026-03-10" },
  { id: 4, description: "Consulta - Ana Costa", amount: 400, type: "income", date: "2026-03-09" },
  { id: 5, description: "Material de escritório", amount: 180, type: "expense", date: "2026-03-08" },
  { id: 6, description: "Consulta - Pedro Lima", amount: 300, type: "income", date: "2026-03-07" },
  { id: 7, description: "Plataforma Telehealth", amount: 79, type: "expense", date: "2026-03-05" },
  { id: 8, description: "Consulta - Carla Souza", amount: 350, type: "income", date: "2026-03-04" },
];

const Financial = () => {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [open, setOpen] = useState(false);
  const [newT, setNewT] = useState({ description: "", amount: "", type: "income" as "income" | "expense", date: "" });

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const profit = totalIncome - totalExpense;

  const handleAdd = () => {
    setTransactions([...transactions, { ...newT, amount: Number(newT.amount), id: Date.now() }]);
    setNewT({ description: "", amount: "", type: "income", date: "" });
    setOpen(false);
  };

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
                <Button onClick={handleAdd} className="w-full gradient-primary font-semibold">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
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

        {/* Transaction list */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {transactions.sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
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
                {t.type === "income" ? "+" : "-"}R$ {t.amount.toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default Financial;
