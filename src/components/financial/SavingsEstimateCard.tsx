import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingDown, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Simplified PF (Carnê-Leão) vs optimized tax simulation
function calculateSavings(monthlyIncome: number) {
  // PF: progressive IR table (simplified 2024/2025)
  let pfTax = 0;
  if (monthlyIncome > 4664.68) pfTax = monthlyIncome * 0.275 - 884.96;
  else if (monthlyIncome > 3751.06) pfTax = monthlyIncome * 0.225 - 651.73;
  else if (monthlyIncome > 2826.66) pfTax = monthlyIncome * 0.15 - 370.40;
  else if (monthlyIncome > 2259.21) pfTax = monthlyIncome * 0.075 - 158.40;
  else pfTax = 0;
  // INSS PF (20% capped)
  const pfInss = Math.min(monthlyIncome * 0.20, 1557.20);
  const pfTotal = Math.max(pfTax, 0) + pfInss;

  // PJ Simples Nacional (estimated ~6% for health services on Anexo III/V)
  const pjTax = monthlyIncome * 0.06;
  const pjInss = 0; // pro-labore min already covered
  const pjTotal = pjTax + pjInss;

  return {
    pfTotal: Math.round(pfTotal),
    pjTotal: Math.round(pjTotal),
    savings: Math.round(pfTotal - pjTotal),
    savingsPercent: pfTotal > 0 ? Math.round(((pfTotal - pjTotal) / pfTotal) * 100) : 0,
  };
}

interface Props {
  monthlyIncome: number;
}

const SavingsEstimateCard = ({ monthlyIncome }: Props) => {
  const { subscription } = useAuth();
  const navigate = useNavigate();

  const { pfTotal, pjTotal, savings, savingsPercent } = useMemo(
    () => calculateSavings(monthlyIncome),
    [monthlyIncome]
  );

  const chartData = [
    { name: "Pessoa Física", value: pfTotal, fill: "hsl(var(--destructive))" },
    { name: "SalbCare", value: pjTotal, fill: "hsl(var(--primary))" },
  ];

  const canChat = subscription.plan === "professional" || subscription.plan === "clinic";

  if (monthlyIncome <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 space-y-4 ring-1 ring-primary/20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Economia Estimada</h3>
            <p className="text-[11px] text-muted-foreground">PF (Carnê-Leão) vs. Otimizado</p>
          </div>
        </div>
        {savings > 0 && (
          <div className="text-right">
            <p className="text-lg font-bold text-primary">
              R$ {savings.toLocaleString("pt-BR")}
            </p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
              <TrendingDown className="h-3 w-3 text-primary" />
              {savingsPercent}% menos impostos/mês
            </p>
          </div>
        )}
      </div>

      {/* Bar chart comparison */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              tickFormatter={(v) => `R$${v}`}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
            />
            <Tooltip
              formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Imposto mensal"]}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        * Simulação estimada com base na tabela IR 2025 e Simples Nacional Anexo III. Consulte seu contador para valores exatos.
      </p>

      {canChat ? (
        <Button
          onClick={() => navigate("/accounting")}
          className="w-full gradient-primary font-semibold gap-2"
          size="sm"
        >
          <MessageCircle className="h-4 w-4" />
          Falar com Contador
        </Button>
      ) : (
        <Button
          onClick={() => navigate("/subscription")}
          variant="outline"
          className="w-full font-semibold gap-2"
          size="sm"
        >
          <Sparkles className="h-4 w-4" />
          Upgrade para falar com Contador
        </Button>
      )}
    </motion.div>
  );
};

export default SavingsEstimateCard;
