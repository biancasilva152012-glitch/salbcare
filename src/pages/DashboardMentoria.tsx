import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Calculator, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageContainer from "@/components/PageContainer";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const DashboardMentoria = () => {
  // Reserva de emergência
  const [receitaMedia, setReceitaMedia] = useState("");
  const reservaIdeal = receitaMedia ? (parseFloat(receitaMedia) * 6) : null;

  // Preço mínimo
  const [custos, setCustos] = useState("");
  const [rendaDesejada, setRendaDesejada] = useState("");
  const [consultas, setConsultas] = useState("");
  const precoMinimo = custos && rendaDesejada && consultas && parseFloat(consultas) > 0
    ? ((parseFloat(custos) + parseFloat(rendaDesejada)) / parseFloat(consultas))
    : null;

  // Carnê-Leão
  const [showGuia, setShowGuia] = useState(false);

  return (
    <PageContainer backTo="/dashboard">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={item}>
          <h1 className="text-xl font-bold">Mentoria</h1>
          <p className="text-xs text-muted-foreground">Ferramentas para organizar suas finanças</p>
        </motion.div>

        {/* Card 1 — Reserva de emergência */}
        <motion.div variants={item} className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold">Reserva de emergência</h2>
          </div>
          <p className="text-xs text-muted-foreground">Quanto você precisa guardar?</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Receita média mensal (R$)</Label>
            <Input
              type="number"
              placeholder="Ex: 8000"
              value={receitaMedia}
              onChange={(e) => setReceitaMedia(e.target.value)}
              min="0"
            />
          </div>
          {reservaIdeal !== null && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-primary/10 p-3 text-center"
            >
              <p className="text-xs text-muted-foreground">Sua reserva ideal (6 meses)</p>
              <p className="text-2xl font-bold text-primary">
                R$ {reservaIdeal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Card 2 — Preço mínimo por consulta */}
        <motion.div variants={item} className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold">Preço mínimo por consulta</h2>
          </div>
          <p className="text-xs text-muted-foreground">Você está cobrando o valor certo?</p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Custos fixos mensais (R$)</Label>
              <Input type="number" placeholder="Ex: 3000" value={custos} onChange={(e) => setCustos(e.target.value)} min="0" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Renda desejada (R$)</Label>
              <Input type="number" placeholder="Ex: 10000" value={rendaDesejada} onChange={(e) => setRendaDesejada(e.target.value)} min="0" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Consultas por mês</Label>
              <Input type="number" placeholder="Ex: 40" value={consultas} onChange={(e) => setConsultas(e.target.value)} min="1" />
            </div>
          </div>
          {precoMinimo !== null && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-primary/10 p-3 text-center"
            >
              <p className="text-xs text-muted-foreground">Seu preço mínimo por consulta</p>
              <p className="text-2xl font-bold text-primary">
                R$ {precoMinimo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Card 3 — Carnê-Leão */}
        <motion.div variants={item} className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold">Carnê-Leão</h2>
          </div>
          <p className="text-xs text-muted-foreground">Como declarar seus recebimentos.</p>
          {!showGuia ? (
            <Button variant="outline" size="sm" onClick={() => setShowGuia(true)}>
              Ver guia
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 text-sm text-muted-foreground leading-relaxed"
            >
              <button onClick={() => setShowGuia(false)} className="text-xs text-primary flex items-center gap-1 mb-2">
                <ArrowLeft className="h-3 w-3" /> Voltar
              </button>
              <p><strong className="text-foreground">O que é o Carnê-Leão?</strong></p>
              <p>É a forma de recolher o Imposto de Renda mensalmente quando você recebe pagamentos de pessoas físicas (seus pacientes).</p>

              <p><strong className="text-foreground">Quem precisa pagar?</strong></p>
              <p>Todo profissional autônomo que recebe mais de R$ 2.112 por mês de pessoas físicas.</p>

              <p><strong className="text-foreground">Como funciona?</strong></p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Acesse o sistema <strong>Carnê-Leão Web</strong> no portal e-CAC da Receita Federal</li>
                <li>Registre todos os seus recebimentos de PF do mês</li>
                <li>Registre as despesas dedutíveis (aluguel do consultório, materiais, etc.)</li>
                <li>O sistema calcula automaticamente o imposto devido</li>
                <li>Gere o DARF e pague até o último dia útil do mês seguinte</li>
              </ol>

              <p><strong className="text-foreground">Despesas que você pode deduzir:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Aluguel do consultório</li>
                <li>Condomínio e IPTU (proporcional ao uso profissional)</li>
                <li>Materiais e equipamentos</li>
                <li>Contribuição ao INSS</li>
                <li>Conselho profissional (CRM, CRP, CRN, etc.)</li>
              </ul>

              <p><strong className="text-foreground">Dica importante:</strong></p>
              <p>Mantenha o controle mensal aqui na SalbCare para facilitar a declaração anual. Todos os recebimentos registrados aqui podem ser usados como referência.</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </PageContainer>
  );
};

export default DashboardMentoria;
