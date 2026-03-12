import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, DollarSign, Calculator } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const chartConfig = {
  income: { label: "Receitas", color: "hsl(142 71% 45%)" },
  expense: { label: "Despesas", color: "hsl(0 72% 51%)" },
  profit: { label: "Lucro", color: "hsl(173 58% 39%)" },
};

const AccountingDashboardTab = () => {
  const { user } = useAuth();

  const { data: transactions = [] } = useQuery({
    queryKey: ["financial", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const now = new Date();
  const currentMonth = format(now, "yyyy-MM");

  const summary = useMemo(() => {
    const monthTx = transactions.filter((t) => t.date.substring(0, 7) === currentMonth);
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const profit = income - expense;

    // Estimated taxes (simplified)
    const annualIncome = transactions
      .filter((t) => t.type === "income" && t.date.substring(0, 4) === format(now, "yyyy"))
      .reduce((s, t) => s + Number(t.amount), 0);
    const simplesRate = annualIncome <= 180000 ? 0.06 : annualIncome <= 360000 ? 0.112 : 0.135;
    const taxes = income * (simplesRate + 0.02); // simples + ISS

    return { income, expense, profit, taxes };
  }, [transactions, currentMonth]);

  const monthlyData = useMemo(() => {
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

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

  const cards = [
    { label: "Receitas", value: summary.income, icon: TrendingUp, className: "text-success" },
    { label: "Despesas", value: summary.expense, icon: TrendingDown, className: "text-destructive" },
    { label: "Lucro", value: summary.profit, icon: DollarSign, className: "text-primary" },
    { label: "Impostos (est.)", value: summary.taxes, icon: Calculator, className: "text-yellow-400" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="glass-card p-3 text-center">
            <c.icon className={`mx-auto h-4 w-4 mb-1 ${c.className}`} />
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-sm font-bold ${c.className}`}>{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-3">
        <p className="text-xs text-muted-foreground mb-2">Receitas vs Despesas vs Lucro (6 meses)</p>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="var(--color-profit)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </motion.div>
  );
};

export default AccountingDashboardTab;
