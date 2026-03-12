import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, DollarSign, Percent, BarChart3,
  ArrowUpRight, ArrowDownRight, Target, Activity
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer, ComposedChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const chartConfig = {
  income: { label: "Receitas", color: "hsl(var(--success, 142 71% 45%))" },
  expense: { label: "Despesas", color: "hsl(var(--destructive))" },
  profit: { label: "Lucro", color: "hsl(var(--primary))" },
  margin: { label: "Margem %", color: "hsl(var(--primary))" },
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

const categoryColors = ["#2dd4bf", "#f97316", "#8b5cf6", "#ec4899", "#3b82f6", "#eab308", "#6b7280"];

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  category: string;
}

interface AdvancedFinancialDashboardProps {
  transactions: Transaction[];
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const AdvancedFinancialDashboard = ({ transactions }: AdvancedFinancialDashboardProps) => {
  const now = new Date();

  // 12-month data
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(now), 11),
      end: startOfMonth(now),
    });

    return months.map((m) => {
      const key = format(m, "yyyy-MM");
      const label = format(m, "MMM", { locale: ptBR });
      const monthTx = transactions.filter((t) => t.date.substring(0, 7) === key);
      const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      const profit = income - expense;
      const margin = income > 0 ? Math.round((profit / income) * 100) : 0;
      return {
        month: label.charAt(0).toUpperCase() + label.slice(1),
        income,
        expense,
        profit,
        margin,
      };
    });
  }, [transactions]);

  // Current & previous month
  const currentMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];

  const incomeGrowth = prevMonth.income > 0
    ? Math.round(((currentMonth.income - prevMonth.income) / prevMonth.income) * 100)
    : 0;
  const expenseGrowth = prevMonth.expense > 0
    ? Math.round(((currentMonth.expense - prevMonth.expense) / prevMonth.expense) * 100)
    : 0;

  // Total annual
  const totalAnnualIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalAnnualExpense = monthlyData.reduce((s, m) => s + m.expense, 0);
  const totalAnnualProfit = totalAnnualIncome - totalAnnualExpense;
  const avgMonthlyProfit = Math.round(totalAnnualProfit / 12);
  const annualMargin = totalAnnualIncome > 0 ? Math.round((totalAnnualProfit / totalAnnualIncome) * 100) : 0;

  // Category breakdown (all time)
  const categoryData = useMemo(() => {
    const byCategory: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const cat = t.category || "outros";
      if (!byCategory[cat]) byCategory[cat] = { income: 0, expense: 0 };
      if (t.type === "income") byCategory[cat].income += Number(t.amount);
      else byCategory[cat].expense += Number(t.amount);
    });
    return Object.entries(byCategory).map(([key, val]) => ({
      category: categories.find((c) => c.value === key)?.label || "Outros",
      income: val.income,
      expense: val.expense,
    }));
  }, [transactions]);

  // Expense distribution pie
  const expensePieData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const cat = t.category || "outros";
        byCategory[cat] = (byCategory[cat] || 0) + Number(t.amount);
      });
    return Object.entries(byCategory)
      .map(([key, value]) => ({
        name: categories.find((c) => c.value === key)?.label || "Outros",
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Top income sources
  const topIncomeSources = useMemo(() => {
    const byDesc: Record<string, { total: number; count: number }> = {};
    transactions
      .filter((t) => t.type === "income")
      .forEach((t) => {
        if (!byDesc[t.description]) byDesc[t.description] = { total: 0, count: 0 };
        byDesc[t.description].total += Number(t.amount);
        byDesc[t.description].count++;
      });
    return Object.entries(byDesc)
      .map(([desc, val]) => ({ description: desc, ...val }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* KPI Cards Row */}
      <motion.div variants={item} className="grid grid-cols-2 gap-2">
        <div className="glass-card p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Receita Anual</span>
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          </div>
          <p className="text-lg font-bold text-success">R$ {totalAnnualIncome.toLocaleString("pt-BR")}</p>
        </div>
        <div className="glass-card p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Despesa Anual</span>
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          </div>
          <p className="text-lg font-bold text-destructive">R$ {totalAnnualExpense.toLocaleString("pt-BR")}</p>
        </div>
        <div className="glass-card p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Lucro Anual</span>
            <DollarSign className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-lg font-bold text-primary">R$ {totalAnnualProfit.toLocaleString("pt-BR")}</p>
        </div>
        <div className="glass-card p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Margem Anual</span>
            <Percent className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-lg font-bold text-primary">{annualMargin}%</p>
        </div>
      </motion.div>

      {/* Growth indicators */}
      <motion.div variants={item} className="grid grid-cols-3 gap-2">
        <div className="glass-card p-3 text-center space-y-1">
          <span className="text-[10px] text-muted-foreground">Méd. Mensal</span>
          <p className="text-sm font-bold">R$ {avgMonthlyProfit.toLocaleString("pt-BR")}</p>
        </div>
        <div className="glass-card p-3 text-center space-y-1">
          <span className="text-[10px] text-muted-foreground">Receita vs mês ant.</span>
          <p className={`text-sm font-bold flex items-center justify-center gap-0.5 ${incomeGrowth >= 0 ? "text-success" : "text-destructive"}`}>
            {incomeGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {incomeGrowth}%
          </p>
        </div>
        <div className="glass-card p-3 text-center space-y-1">
          <span className="text-[10px] text-muted-foreground">Despesa vs mês ant.</span>
          <p className={`text-sm font-bold flex items-center justify-center gap-0.5 ${expenseGrowth <= 0 ? "text-success" : "text-destructive"}`}>
            {expenseGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {expenseGrowth}%
          </p>
        </div>
      </motion.div>

      {/* Revenue & Profit Area Chart - 12 months */}
      <motion.div variants={item} className="glass-card p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold">Evolução Financeira (12 meses)</p>
        </div>
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="month" tick={{ fontSize: 9 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 9 }} className="fill-muted-foreground" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="income" stroke="var(--color-income)" fill="url(#incomeGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="profit" stroke="var(--color-profit)" fill="url(#profitGrad)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </motion.div>

      {/* Margin trend */}
      <motion.div variants={item} className="glass-card p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Target className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold">Margem de Lucro Mensal (%)</p>
        </div>
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <ComposedChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="month" tick={{ fontSize: 9 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 9 }} className="fill-muted-foreground" unit="%" />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-md bg-popover px-3 py-2 text-xs shadow-md border border-border">
                    <p className="font-medium">{payload[0]?.payload?.month}</p>
                    <p className="text-primary">Margem: {payload[0]?.value}%</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="margin" fill="hsl(var(--primary) / 0.2)" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="margin" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ChartContainer>
      </motion.div>

      {/* Category comparison (income vs expense) */}
      <motion.div variants={item} className="glass-card p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold">Receita vs Despesa por Categoria</p>
        </div>
        {categoryData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis type="number" tick={{ fontSize: 9 }} className="fill-muted-foreground" />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 9 }} className="fill-muted-foreground" width={65} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="income" fill="var(--color-income)" radius={[0, 4, 4, 0]} barSize={10} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={[0, 4, 4, 0]} barSize={10} />
            </BarChart>
          </ChartContainer>
        )}
      </motion.div>

      {/* Expense distribution */}
      <motion.div variants={item} className="glass-card p-3">
        <p className="text-xs font-semibold mb-2">Distribuição de Despesas (Total)</p>
        {expensePieData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sem despesas</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-[180px] w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expensePieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              {expensePieData.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: categoryColors[i % categoryColors.length] }} />
                    <span className="truncate">{entry.name}</span>
                  </div>
                  <span className="font-medium shrink-0 ml-1">R$ {entry.value.toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Top income sources */}
      <motion.div variants={item} className="glass-card p-3">
        <p className="text-xs font-semibold mb-2">Principais Fontes de Receita</p>
        {topIncomeSources.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sem receitas registradas</p>
        ) : (
          <div className="space-y-2">
            {topIncomeSources.map((source, i) => {
              const maxTotal = topIncomeSources[0].total;
              const width = maxTotal > 0 ? (source.total / maxTotal) * 100 : 0;
              return (
                <div key={source.description} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[60%]">{source.description}</span>
                    <span className="font-medium text-success">R$ {source.total.toLocaleString("pt-BR")} <span className="text-muted-foreground font-normal">({source.count}x)</span></span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AdvancedFinancialDashboard;
