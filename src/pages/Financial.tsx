import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { addMonths, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, FileDown, Filter, Pencil, Plus, Receipt, Sparkles, Trash2, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import PageContainer from "@/components/PageContainer";
import PageSkeleton from "@/components/PageSkeleton";
import ListPagination from "@/components/ListPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { usePagination } from "@/hooks/usePagination";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { useFinancialSuggestions } from "@/hooks/useFinancialSuggestions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { maskCurrency, parseBRL } from "@/utils/currencyMask";
import { exportFinancialPdf } from "@/utils/exportFinancialPdf";
import GuestFinancialPreview from "@/components/financial/GuestFinancialPreview";
import UpgradeModal from "@/components/UpgradeModal";

type Transaction = {
  id: string;
  description: string;
  amount: number | string;
  type: string;
  date: string;
  category: string | null;
};

type Charge = {
  id: string;
  patient_name: string;
  gross_amount: number | string;
  appointment_date: string;
  status: string;
};

const chartConfig = {
  income: { label: "Receitas", color: "hsl(var(--success))" },
  expense: { label: "Despesas", color: "hsl(var(--destructive))" },
  profit: { label: "Resultado", color: "hsl(var(--primary))" },
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

const emptyForm = {
  description: "",
  amount: "",
  type: "income" as "income" | "expense",
  date: format(new Date(), "yyyy-MM-dd"),
  category: "outros",
};

const money = (value: number) => `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

const Financial = () => {
  const { user } = useAuth();
  const { hasAccess } = useFeatureGate();
  const { canAddFinancial, financialCount, financialLimit, isFree } = useFreemiumLimits();
  const suggestions = useFinancialSuggestions();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const descriptionRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(new Date());
  const [filterMode, setFilterMode] = useState<"all" | "income" | "expense" | "charges">("all");

  useEffect(() => {
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const description = searchParams.get("description");
    const autoOpen = searchParams.get("autoOpen") === "1";
    if (!type && !category && !description && !autoOpen) return;
    setForm((previous) => ({
      ...previous,
      type: type === "expense" ? "expense" : type === "income" ? "income" : previous.type,
      category: category || previous.category,
      description: description || previous.description,
    }));
    if (autoOpen) {
      setOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("type");
      next.delete("category");
      next.delete("description");
      next.delete("autoOpen");
      setSearchParams(next, { replace: true });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => descriptionRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, [open]);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["financial", user?.id],
    queryFn: async (): Promise<Transaction[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from("financial_transactions")
        .select("id, description, amount, type, date, category")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: charges = [] } = useQuery({
    queryKey: ["financial-consultation-payments", user?.id],
    queryFn: async (): Promise<Charge[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("consultation_payments")
        .select("id, patient_name, gross_amount, appointment_date, status")
        .eq("doctor_id", user.id)
        .order("appointment_date", { ascending: false })
        .limit(100);
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
    staleTime: 90_000,
  });

  if (!user) return <GuestFinancialPreview />;

  const validateForm = () => {
    if (!form.description.trim()) {
      toast.error("Preencha a descrição.");
      return false;
    }
    if (!form.amount || parseBRL(form.amount) <= 0) {
      toast.error("Informe um valor válido.");
      return false;
    }
    if (!form.date) {
      toast.error("Selecione uma data.");
      return false;
    }
    return true;
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) throw new Error("validation");
      const { error } = await supabase.from("financial_transactions").insert({
        user_id: user.id,
        description: form.description.trim(),
        amount: parseBRL(form.amount),
        type: form.type,
        date: form.date,
        category: form.category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      setForm(emptyForm);
      setOpen(false);
      toast.success("Lançamento adicionado.");
    },
    onError: (error) => {
      if (error.message === "validation") return;
      toast.error("Não conseguimos salvar. Tente de novo em instantes.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editId) return;
      if (!validateForm()) throw new Error("validation");
      const { error } = await supabase
        .from("financial_transactions")
        .update({
          description: form.description.trim(),
          amount: parseBRL(form.amount),
          type: form.type,
          date: form.date,
          category: form.category,
        })
        .eq("id", editId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      setForm(emptyForm);
      setEditOpen(false);
      setEditId(null);
      toast.success("Lançamento atualizado.");
    },
    onError: (error) => {
      if (error.message === "validation") return;
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
      toast.success("Lançamento excluído.");
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
  });

  const openEdit = (transaction: Transaction) => {
    setEditId(transaction.id);
    setForm({
      description: transaction.description,
      amount: Number(transaction.amount).toLocaleString("pt-BR"),
      type: transaction.type === "expense" ? "expense" : "income",
      date: transaction.date,
      category: transaction.category || "outros",
    });
    setEditOpen(true);
  };

  const filterKey = format(filterMonth, "yyyy-MM");
  const monthLabel = format(filterMonth, "MMMM yyyy", { locale: ptBR });
  const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  const monthTransactions = transactions.filter((transaction) => transaction.date.substring(0, 7) === filterKey);
  const income = monthTransactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const expense = monthTransactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const result = income - expense;
  const monthCharges = charges.filter((charge) => charge.appointment_date.substring(0, 7) === filterKey);
  const receivable = monthCharges
    .filter((charge) => !["paid", "succeeded", "confirmed"].includes(charge.status))
    .reduce((sum, charge) => sum + Number(charge.gross_amount), 0);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: Record<string, { month: string; income: number; expense: number; profit: number }> = {};
    for (let index = 5; index >= 0; index -= 1) {
      const date = subMonths(now, index);
      const key = format(date, "yyyy-MM");
      const label = format(date, "MMM", { locale: ptBR });
      months[key] = { month: label.charAt(0).toUpperCase() + label.slice(1), income: 0, expense: 0, profit: 0 };
    }
    transactions.forEach((transaction) => {
      const key = transaction.date.substring(0, 7);
      if (!months[key]) return;
      const amount = Number(transaction.amount);
      if (transaction.type === "income") months[key].income += amount;
      if (transaction.type === "expense") months[key].expense += amount;
      months[key].profit = months[key].income - months[key].expense;
    });
    return Object.values(months);
  }, [transactions]);

  const insights = useMemo(() => {
    const list: string[] = [];
    if (monthTransactions.length === 0) list.push("Nenhuma movimentação registrada neste mês.");
    if (income > 0 && expense === 0) list.push("Você registrou receitas, mas ainda não registrou despesas do mês.");
    if (expense > income && income > 0) list.push("As despesas passaram das receitas neste mês.");
    if (result > 0) list.push(`Resultado positivo de ${money(result)} neste mês.`);
    if (receivable > 0) list.push(`${money(receivable)} aparecem como cobranças ainda não confirmadas.`);
    if (list.length === 0) list.push("Seu financeiro está pronto para receber novos lançamentos.");
    return list.slice(0, 3);
  }, [expense, income, monthTransactions.length, receivable, result]);

  const records = filterMode === "all"
    ? monthTransactions
    : filterMode === "charges"
      ? []
      : monthTransactions.filter((transaction) => transaction.type === filterMode);
  const pagination = usePagination(records);

  const transactionForm = (isEdit: boolean) => {
    const descriptionSuggestions = suggestions.suggestionsFor(form.type);
    const datalistId = `tx-suggestions-${isEdit ? "edit" : "new"}`;
    return (
      <div className="space-y-3 pt-2">
        <div className="space-y-1.5">
          <Label>Descrição</Label>
          <Input
            ref={descriptionRef}
            list={datalistId}
            placeholder={form.type === "income" ? "Ex: Consulta particular" : "Ex: Aluguel do consultório"}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="bg-accent border-border"
          />
          <datalist id={datalistId}>
            {descriptionSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Valor</Label>
            <Input inputMode="numeric" placeholder="Ex: 350" value={form.amount} onChange={(event) => setForm({ ...form, amount: maskCurrency(event.target.value) })} className="bg-accent border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as "income" | "expense" })}>
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
          <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
            <SelectTrigger className="bg-accent border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((category) => <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Data</Label>
          <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="bg-accent border-border" />
        </div>
        <Button className="w-full" onClick={() => isEdit ? updateMutation.mutate() : addMutation.mutate()} disabled={addMutation.isPending || updateMutation.isPending}>
          {isEdit ? "Salvar lançamento" : "Adicionar lançamento"}
        </Button>
      </div>
    );
  };

  if (isLoading) return <PageContainer><PageSkeleton variant="list" /></PageContainer>;

  return (
    <PageContainer>
      <div className="space-y-5">
        <header className="space-y-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Financeiro</p>
              <h1 className="truncate text-2xl font-bold leading-tight">Como está seu negócio?</h1>
            </div>
            {hasAccess("pdf_export") && (
              <Button size="icon" variant="outline" aria-label="Exportar PDF" onClick={() => exportFinancialPdf(transactions, filterMonth)}>
                <FileDown className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (value) setForm(emptyForm); }}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2" onClick={() => { if (!canAddFinancial) setUpgradeOpen(true); }}>
                <Plus className="h-4 w-4" /> Novo lançamento
              </Button>
            </DialogTrigger>
            {canAddFinancial && (
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
                {transactionForm(false)}
              </DialogContent>
            )}
          </Dialog>
        </header>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Receita este mês</p>
          <p className="mt-2 font-mono text-4xl font-semibold leading-none text-foreground">{money(income)}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-background p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">A receber</p>
              <p className="mt-1 truncate font-mono text-sm font-semibold">{money(receivable)}</p>
            </div>
            <div className="rounded-xl bg-background p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Despesas</p>
              <p className="mt-1 truncate font-mono text-sm font-semibold">{money(expense)}</p>
            </div>
            <div className="rounded-xl bg-background p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Resultado</p>
              <p className="mt-1 truncate font-mono text-sm font-semibold">{money(result)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <Button size="icon" variant="ghost" aria-label="Mês anterior" onClick={() => setFilterMonth(subMonths(filterMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{capitalizedMonth}</span>
            </div>
            <Button size="icon" variant="ghost" aria-label="Próximo mês" onClick={() => setFilterMonth(addMonths(filterMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart data={monthlyData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="income" fill="var(--color-income)" radius={[5, 5, 0, 0]} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            <p className="text-sm font-bold">Insights reais</p>
          </div>
          <div className="mt-3 space-y-2">
            {insights.map((insight) => (
              <p key={insight} className="text-sm leading-relaxed text-muted-foreground">{insight}</p>
            ))}
          </div>
        </section>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            ["all", "Lançamentos"],
            ["income", "Receitas"],
            ["expense", "Despesas"],
            ["charges", "Cobranças"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilterMode(value as typeof filterMode)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-xs font-semibold transition-colors ${filterMode === value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Editar lançamento</DialogTitle></DialogHeader>
            {transactionForm(true)}
          </DialogContent>
        </Dialog>

        {filterMode === "charges" ? (
          <section className="space-y-2">
            {monthCharges.map((charge) => (
              <div key={charge.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
                    <Receipt className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{charge.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(`${charge.appointment_date}T12:00:00`).toLocaleDateString("pt-BR")} · {charge.status}</p>
                  </div>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold">{money(Number(charge.gross_amount))}</p>
              </div>
            ))}
            {monthCharges.length === 0 && <p className="rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">Nenhuma cobrança encontrada neste mês.</p>}
          </section>
        ) : (
          <section className="space-y-2">
            {pagination.paginatedItems.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${transaction.type === "income" ? "bg-accent" : "bg-muted"}`}>
                    {transaction.type === "income" ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{categories.find((category) => category.value === transaction.category)?.label || "Outros"} · {new Date(`${transaction.date}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <p className="font-mono text-sm font-semibold">{transaction.type === "income" ? "+" : "-"}{money(Number(transaction.amount))}</p>
                  <Button size="icon" variant="ghost" aria-label="Editar lançamento" onClick={() => openEdit(transaction)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label="Excluir lançamento">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteMutation.mutate(transaction.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {records.length === 0 && <p className="rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">Nenhuma movimentação registrada neste mês.</p>}
            <ListPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              hasNext={pagination.hasNext}
              hasPrev={pagination.hasPrev}
              onNext={pagination.nextPage}
              onPrev={pagination.prevPage}
            />
          </section>
        )}

        {isFree && (
          <p className="text-center text-xs text-muted-foreground">Lançamentos este mês: {financialCount}/{financialLimit}</p>
        )}
        <Button variant="outline" className="w-full gap-2" onClick={() => window.location.assign("/dashboard/mentoria")}>
          <TrendingUp className="h-4 w-4" /> Analisar com o Copilot
        </Button>
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="lançamentos financeiros" currentUsage={financialCount} limit={financialLimit} />
    </PageContainer>
  );
};

export default Financial;
