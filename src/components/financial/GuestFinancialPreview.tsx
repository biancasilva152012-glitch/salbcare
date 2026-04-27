import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

/**
 * Read-only Financial preview for unauthenticated visitors.
 * Shows realistic seed data so visitors can SEE the value of the module
 * before creating an account. No edits, no localStorage writes.
 */

const seedTransactions = [
  { id: "d1", description: "Consulta particular — João S.", amount: 350, type: "income", date: "2026-04-22", category: "consulta" },
  { id: "d2", description: "Consulta particular — Maria L.", amount: 280, type: "income", date: "2026-04-20", category: "consulta" },
  { id: "d3", description: "Aluguel do consultório", amount: 1800, type: "expense", date: "2026-04-05", category: "aluguel" },
  { id: "d4", description: "Consulta de retorno — Pedro A.", amount: 200, type: "income", date: "2026-04-18", category: "consulta" },
  { id: "d5", description: "Material de escritório", amount: 145, type: "expense", date: "2026-04-12", category: "material" },
  { id: "d6", description: "Consulta particular — Ana R.", amount: 350, type: "income", date: "2026-04-15", category: "consulta" },
  { id: "d7", description: "Software de prontuário", amount: 89, type: "expense", date: "2026-04-01", category: "outros" },
  { id: "d8", description: "Marketing digital", amount: 250, type: "expense", date: "2026-04-10", category: "marketing" },
];

const monthlyData = [
  { month: "Nov", income: 4200, expense: 2100, profit: 2100 },
  { month: "Dez", income: 5100, expense: 2300, profit: 2800 },
  { month: "Jan", income: 4800, expense: 2200, profit: 2600 },
  { month: "Fev", income: 6200, expense: 2500, profit: 3700 },
  { month: "Mar", income: 5800, expense: 2400, profit: 3400 },
  { month: "Abr", income: 7400, expense: 2800, profit: 4600 },
];

const categoryData = [
  { name: "Aluguel", value: 1800 },
  { name: "Marketing", value: 250, },
  { name: "Material", value: 145 },
  { name: "Outros", value: 89 },
];
const categoryColors = ["#2dd4bf", "#f97316", "#8b5cf6", "#ec4899"];

const chartConfig = {
  income: { label: "Receitas", color: "hsl(var(--success, 142 71% 45%))" },
  expense: { label: "Despesas", color: "hsl(var(--destructive))" },
};

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const GuestFinancialPreview = () => {
  const totalIncome = seedTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = seedTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const profit = totalIncome - totalExpense;

  return (
    <PageContainer backTo="/dashboard">
      <div className="space-y-5">
        {/* Header com badge de demo */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">Financeiro</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
              <Lock className="h-3 w-3" /> Modo demonstração
            </span>
          </div>
          <Button size="sm" asChild className="gradient-primary gap-1">
            <Link to="/register?redirect=/dashboard/financial">
              Liberar com cadastro grátis <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Estes números são <strong>exemplos para você visualizar</strong> como o módulo funciona.
          Crie sua conta gratuita para registrar suas próprias receitas e despesas com segurança.
        </p>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Receitas (Abr)</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-emerald-500">{fmt(totalIncome)}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Despesas (Abr)</span>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-xl font-bold text-rose-500">{fmt(totalExpense)}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Lucro (Abr)</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-primary">{fmt(profit)}</p>
          </motion.div>
        </div>

        {/* Gráfico de evolução */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">Evolução dos últimos 6 meses</h2>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Bar dataKey="income" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Grid: pizza + lista */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3">Despesas por categoria</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e) => e.name}>
                  {categoryData.map((_, i) => <Cell key={i} fill={categoryColors[i % categoryColors.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3">Últimas transações</h2>
            <ul className="space-y-2 max-h-[200px] overflow-auto">
              {seedTransactions.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm border-b border-border pb-1 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-foreground">{t.description}</p>
                    <p className="text-[11px] text-muted-foreground">{t.date.split("-").reverse().join("/")}</p>
                  </div>
                  <span className={`font-semibold ${t.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                    {t.type === "income" ? "+" : "−"} {fmt(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA final */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5 text-center"
        >
          <Lock className="h-6 w-6 text-primary mx-auto mb-2" />
          <h3 className="text-base font-bold text-foreground">Pronto pra registrar suas próprias finanças?</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md mx-auto">
            Cadastro grátis em menos de 1 minuto. Sem cartão. Seus dados ficam só com você.
          </p>
          <Button asChild className="gradient-primary">
            <Link to="/register?redirect=/dashboard/financial">
              Criar conta grátis <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default GuestFinancialPreview;
