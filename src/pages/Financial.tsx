import { useState, useMemo } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import ListPagination from "@/components/ListPagination";
import { usePagination } from "@/hooks/usePagination";
import { motion } from "framer-motion";
import { parseBRL, maskCurrency } from "@/utils/currencyMask";
import { Plus, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, FileDown, Crown } from "lucide-react";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import UpgradeModal from "@/components/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, subMonths, addMonths } from "date-fns";
import { exportFinancialPdf } from "@/utils/exportFinancialPdf";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { ptBR } from "date-fns/locale";
import AdvancedFinancialDashboard from "@/components/financial/AdvancedFinancialDashboard";
import SavingsEstimateCard from "@/components/financial/SavingsEstimateCard";
import TaxSimulatorWidget from "@/components/financial/TaxSimulatorWidget";
import FeatureGate from "@/components/FeatureGate";
import EmptyState from "@/components/EmptyState";
import ConsultationPaymentsTab from "@/components/financial/ConsultationPayments";

const chartConfig = {
  income: { label: "Receitas", color: "hsl(var(--success, 142 71% 45%))" },
  expense: { label: "Despesas", color: "hsl(var(--destructive))" },
  profit: { label: "Lucro", color: "hsl(var(--primary))" },
};

const categories = [
  { value: "consulta", label: "Consulta" },
  { value: "material", label: "Material" },
  { value: "aluguel", label: "Aluguel" },
  { value: "salario", label: "Salário" },
  { value: "equipamento", label: "Equipamento" },
  { value: "marketing", label: "Marketing" },
  { value: "outros", label: "Outros" },
];

const emptyForm = { description: "", amount: "", type: "income" as "income" | "expense", date: format(new Date(), "yyyy-MM-dd"), category: "outros" };

const Financial = () => {
  const { user } = useAuth();
  const { hasAccess } = useFeatureGate();
  const { canAddFinancial, financialCount, financialLimit, isFree } = useFreemiumLimits();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(new Date());
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["financial", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("financial_transactions").select("id, description, amount, type, date, category").eq("user_id", user!.id).order("date", { ascending: false }).limit(500);
      return data || [];
    },
    enabled: !!user,
  });

  const validateForm = () => {
    if (!form.description.trim()) { toast.error("Preencha a descrição."); return false; }
    if (!form.amount || parseBRL(form.amount) <= 0) { toast.error("Informe um valor válido."); return false; }
    if (!form.date) { toast.error("Selecione uma data."); return false; }
    return true;
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) throw new Error("validation");
      const { error } = await supabase.from("financial_transactions").insert({
        user_id: user!.id, description: form.description.trim(), amount: parseBRL(form.amount), type: form.type, date: form.date, category: form.category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      setForm(emptyForm);
      setOpen(false);
      toast.success("Transação adicionada!");
    },
    onError: (err) => {
      if (err.message === "validation") return;
      toast.error("Não conseguimos salvar. Tente de novo em instantes.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) throw new Error("validation");
      const { error } = await supabase.from("financial_transactions").update({
        description: form.description.trim(), amount: parseBRL(form.amount), type: form.type, date: form.date, category: form.category,
      }).eq("id", editId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      setForm(emptyForm);
      setEditOpen(false);
      setEditId(null);
      toast.success("Transação atualizada!");
    },
    onError: (err) => {
      if (err.message === "validation") return;
      toast.error("Não conseguimos salvar. Tente de novo em instantes.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      toast.success("Transação excluída!");
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
  });

  const openEdit = (t: typeof transactions[0]) => {
    setEditId(t.id);
    setForm({ description: t.description, amount: Number(t.amount).toLocaleString("pt-BR"), type: t.type as "income" | "expense", date: t.date, category: t.category || "outros" });
    setEditOpen(true);
  };

  const filterKey = format(filterMonth, "yyyy-MM");
  const filteredByMonth = transactions.filter((t) => t.date.substring(0, 7) === filterKey);
  const filteredTransactions = filterCategory === "all" ? filteredByMonth : filteredByMonth.filter((t) => t.category === filterCategory);
  const txPagination = usePagination(filteredTransactions);

  const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const profit = totalIncome - totalExpense;

  const filterLabel = format(filterMonth, "MMMM yyyy", { locale: ptBR });
  const capitalizedLabel = filterLabel.charAt(0).toUpperCase() + filterLabel.slice(1);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: Record<string, { month: string; income: number; expense: number; profit: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM", { locale: ptBR });
      months[key] = { month: label.charAt(0).toUpperCase() + label.slice(1), income: 0, expense: 0, profit: 0 };
    }
    transactions.forEach((t) => {
      const key = t.date.substring(0, 7);
      if (months[key]) {
        const amt = Number(t.amount);
        if (t.type === "income") months[key].income += amt;
        else months[key].expense += amt;
        months[key].profit = months[key].income - months[key].expense;
      }
    });
    return Object.values(months);
  }, [transactions]);

  const categoryColors = ["#2dd4bf", "#f97316", "#8b5cf6", "#ec4899", "#3b82f6", "#eab308", "#6b7280"];

  const categoryData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    filteredByMonth
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const cat = t.category || "outros";
        byCategory[cat] = (byCategory[cat] || 0) + Number(t.amount);
      });
    return Object.entries(byCategory).map(([key, value]) => ({
      name: categories.find((c) => c.value === key)?.label || "Outros",
      value,
    }));
  }, [filteredByMonth]);

  const transactionFormJsx = (isEdit: boolean) => (
    <div className="space-y-3 pt-2">
      <div className="space-y-1.5"><Label>Descrição</Label><Input placeholder="Ex: Consulta particular" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-accent border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Valor (R$)</Label><Input type="text" inputMode="numeric" placeholder="Ex: 1.500" value={form.amount} onChange={(e) => setForm({ ...form, amount: maskCurrency(e.target.value) })} className="bg-accent border-border" /></div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "income" | "expense" })}>
            <SelectTrigger className="bg-accent border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Receita</SelectItem>
              <SelectItem value="expense">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger className="bg-accent border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-accent border-border" /></div>
      <Button onClick={() => isEdit ? updateMutation.mutate() : addMutation.mutate()} className="w-full gradient-primary font-semibold" disabled={addMutation.isPending || updateMutation.isPending}>
        {isEdit ? (updateMutation.isPending ? "Salvando..." : "Salvar") : (addMutation.isPending ? "Adicionando..." : "Adicionar")}
      </Button>
    </div>
  );

  if (isLoading) {
    return <PageContainer><PageSkeleton variant="list" /></PageContainer>;
  }

  return (
    <PageContainer backTo="/dashboard">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <div className="flex items-center gap-2">
            {hasAccess("pdf_export") && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => exportFinancialPdf(transactions, filterMonth)}>
                <FileDown className="h-4 w-4" /> PDF
              </Button>
            )}
            {canAddFinancial ? (
              <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setForm(emptyForm); }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gradient-primary gap-1"><Plus className="h-4 w-4" /> Novo</Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
                  {transactionFormJsx(false)}
                </DialogContent>
              </Dialog>
            ) : (
              <Button size="sm" className="gradient-primary gap-1" onClick={() => setUpgradeOpen(true)}>
                <Plus className="h-4 w-4" /> Novo
              </Button>
            )}
          </div>
        </div>

        {/* Tax Simulator Widget - always visible */}
        <TaxSimulatorWidget />

        {/* Savings Estimate Card for Pro+ */}
        {(hasAccess("accounting_marketplace")) && (
          <SavingsEstimateCard monthlyIncome={totalIncome} />
        )}

        <Tabs defaultValue="consultas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consultas">💰 Consultas</TabsTrigger>
            <TabsTrigger value="geral">📊 Geral</TabsTrigger>
            {hasAccess("advanced_financial_dashboard") && <TabsTrigger value="avancado"><Crown className="h-3 w-3 mr-1" /> Avançado</TabsTrigger>}
          </TabsList>

          <TabsContent value="consultas" className="mt-4">
            <ConsultationPaymentsTab />
          </TabsContent>

          <TabsContent value="geral" className="mt-4 space-y-5">

        {/* Month Filter */}
        <div className="flex items-center justify-between glass-card p-2.5">
          <button onClick={() => setFilterMonth(subMonths(filterMonth, 1))} className="p-1 rounded-md hover:bg-accent"><ChevronLeft className="h-4 w-4 text-muted-foreground" /></button>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{capitalizedLabel}</span>
          </div>
          <button onClick={() => setFilterMonth(addMonths(filterMonth, 1))} className="p-1 rounded-md hover:bg-accent"><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterCategory("all")}
            className={`shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors ${filterCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilterCategory(c.value)}
              className={`shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors ${filterCategory === c.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {c.label}
            </button>
          ))}
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



        <Tabs defaultValue="bar" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="bar" className="flex-1 text-xs">Barras</TabsTrigger>
            <TabsTrigger value="line" className="flex-1 text-xs">Evolução</TabsTrigger>
            <TabsTrigger value="pie" className="flex-1 text-xs">Categorias</TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1 text-xs gap-1">
              <Crown className="h-3 w-3" /> Avançado
            </TabsTrigger>
          </TabsList>
          <TabsContent value="bar">
            <div className="glass-card p-3">
              <p className="text-xs text-muted-foreground mb-2">Receitas vs Despesas (6 meses)</p>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </TabsContent>
          <TabsContent value="line">
            <div className="glass-card p-3">
              <p className="text-xs text-muted-foreground mb-2">Evolução do Lucro (6 meses)</p>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="expense" stroke="var(--color-expense)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            </div>
          </TabsContent>
          <TabsContent value="pie">
            <div className="glass-card p-3">
              <p className="text-xs text-muted-foreground mb-2">Despesas por Categoria ({capitalizedLabel})</p>
              {categoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Sem despesas neste mês</p>
              ) : (
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="rounded-md bg-popover px-3 py-2 text-xs shadow-md border border-border">
                              <p className="font-medium">{payload[0].name}</p>
                              <p className="text-muted-foreground">R$ {Number(payload[0].value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="advanced">
            <FeatureGate feature="advanced_financial_dashboard">
              <AdvancedFinancialDashboard transactions={transactions} />
            </FeatureGate>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Editar Transação</DialogTitle></DialogHeader>
            {transactionFormJsx(true)}
          </DialogContent>
        </Dialog>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {filteredTransactions.length === 0 && transactions.length === 0 && (
            <EmptyState
              icon={DollarSign}
              title="Nenhum lançamento ainda"
              description="Seus lançamentos aparecerão aqui. Registre sua primeira receita para começar a ver seu lucro real."
              actionLabel="Registrar receita"
              onAction={() => { setForm({ ...emptyForm, type: "income" }); setOpen(true); }}
            />
          )}
          {filteredTransactions.length === 0 && transactions.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação neste mês</p>
          )}
          {txPagination.paginatedItems.map((t) => (
            <div key={t.id} className="glass-card flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.type === "income" ? "bg-success/10" : "bg-destructive/10"}`}>
                  {t.type === "income" ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{categories.find(c => c.value === t.category)?.label || "Outros"}</span>
                    <p className="text-xs text-muted-foreground">{new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                  {t.type === "income" ? "+" : "-"}R$ {Number(t.amount).toLocaleString("pt-BR")}
                </span>
                <button onClick={() => openEdit(t)} className="text-primary hover:text-primary/80"><Pencil className="h-3.5 w-3.5" /></button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="text-destructive hover:text-destructive/80"><Trash2 className="h-3.5 w-3.5" /></button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(t.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          <ListPagination
            page={txPagination.page}
            totalPages={txPagination.totalPages}
            totalItems={txPagination.totalItems}
            hasNext={txPagination.hasNext}
            hasPrev={txPagination.hasPrev}
            onNext={txPagination.nextPage}
            onPrev={txPagination.prevPage}
          />
         </motion.div>
          </TabsContent>

          {hasAccess("advanced_financial_dashboard") && (
            <TabsContent value="avancado" className="mt-4">
              <AdvancedFinancialDashboard transactions={transactions} />
            </TabsContent>
          )}
        </Tabs>
        {isFree && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Lançamentos este mês: {financialCount}/{financialLimit} (plano gratuito)
          </p>
        )}
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="lançamentos financeiros" currentUsage={financialCount} limit={financialLimit} />
    </PageContainer>
  );
};

export default Financial;
