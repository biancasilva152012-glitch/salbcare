import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Calculator, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const TaxCalculationTab = () => {
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

  const taxes = useMemo(() => {
    const monthlyIncome = transactions
      .filter((t) => t.type === "income" && t.date.substring(0, 7) === currentMonth)
      .reduce((s, t) => s + Number(t.amount), 0);

    const annualIncome = transactions
      .filter((t) => t.type === "income" && t.date.substring(0, 4) === format(now, "yyyy"))
      .reduce((s, t) => s + Number(t.amount), 0);

    // Simples Nacional (approximate rates for healthcare)
    const simplesRate = annualIncome <= 180000 ? 0.06 : annualIncome <= 360000 ? 0.112 : 0.135;
    const simplesMonthly = monthlyIncome * simplesRate;
    const simplesAnnual = annualIncome * simplesRate;

    // ISS (2% to 5% depending on city)
    const issRate = 0.02;
    const issMonthly = monthlyIncome * issRate;
    const issAnnual = annualIncome * issRate;

    // INSS (11% for individual contributor, capped)
    const inssCap = 877.24; // approximate 2024 cap
    const inssMonthly = Math.min(monthlyIncome * 0.11, inssCap);
    const inssAnnual = inssMonthly * 12;

    // IR (simplified progressive table)
    let irRate = 0;
    if (monthlyIncome > 4664.68) irRate = 0.275;
    else if (monthlyIncome > 3751.06) irRate = 0.225;
    else if (monthlyIncome > 2826.66) irRate = 0.15;
    else if (monthlyIncome > 2112.01) irRate = 0.075;
    const irMonthly = monthlyIncome * irRate;
    const irAnnual = annualIncome * irRate;

    return {
      monthlyIncome,
      annualIncome,
      simples: { rate: simplesRate, monthly: simplesMonthly, annual: simplesAnnual },
      iss: { rate: issRate, monthly: issMonthly, annual: issAnnual },
      inss: { monthly: inssMonthly, annual: inssAnnual },
      ir: { rate: irRate, monthly: irMonthly, annual: irAnnual },
      totalMonthly: simplesMonthly + issMonthly + inssMonthly + irMonthly,
      totalAnnual: simplesAnnual + issAnnual + inssAnnual + irAnnual,
    };
  }, [transactions, currentMonth]);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  const taxItems = [
    { label: "Simples Nacional", rate: pct(taxes.simples.rate), monthly: taxes.simples.monthly, annual: taxes.simples.annual, color: "text-blue-400" },
    { label: "ISS", rate: pct(taxes.iss.rate), monthly: taxes.iss.monthly, annual: taxes.iss.annual, color: "text-purple-400" },
    { label: "INSS", rate: "11%", monthly: taxes.inss.monthly, annual: taxes.inss.annual, color: "text-orange-400" },
    { label: "IR", rate: pct(taxes.ir.rate), monthly: taxes.ir.monthly, annual: taxes.ir.annual, color: "text-red-400" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="glass-card p-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">Valores estimados com base nas suas receitas. Consulte um contador para valores exatos.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="glass-card p-3 text-center">
          <Calculator className="mx-auto h-4 w-4 text-primary mb-1" />
          <p className="text-xs text-muted-foreground">Impostos Mensais</p>
          <p className="text-sm font-bold text-primary">{fmt(taxes.totalMonthly)}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <TrendingUp className="mx-auto h-4 w-4 text-secondary mb-1" />
          <p className="text-xs text-muted-foreground">Estimativa Anual</p>
          <p className="text-sm font-bold text-secondary">{fmt(taxes.totalAnnual)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {taxItems.map((tax) => (
          <div key={tax.label} className="glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${tax.color}`}>{tax.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{tax.rate}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Mensal</p>
                <p className="font-medium">{fmt(tax.monthly)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Anual (est.)</p>
                <p className="font-medium">{fmt(tax.annual)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TaxCalculationTab;
