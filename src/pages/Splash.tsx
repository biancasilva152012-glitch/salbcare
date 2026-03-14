import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HeartPulse, ArrowRight, Calculator, FileText, TrendingUp, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const differentials = [
  { icon: Calculator, label: "Contador especializado em saúde incluso" },
  { icon: FileText, label: "Emissão de notas fiscais 100% legal" },
  { icon: TrendingUp, label: "Gestão financeira sem complicação" },
  { icon: Shield, label: "CNPJ, IR e tributos resolvidos pra você" },
];

const bullets = [
  "Agenda, prontuário e teleconsulta",
  "Assessoria contábil integrada",
  "Menor preço do mercado",
  "7 dias grátis — sem cartão",
];

const Splash = () => (
  <div className="flex min-h-screen flex-col items-center justify-center px-6">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-sm space-y-8 text-center"
    >
      <div>
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-lg shadow-primary/20">
          <HeartPulse className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">SALBCARE</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Você cuida dos pacientes.{" "}
          <span className="text-primary font-semibold">A gente cuida do seu negócio.</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Gestão completa + assessoria contábil especializada em saúde, pelo menor preço do mercado.
        </p>
      </div>

      <div className="space-y-2">
        {differentials.map(({ icon: Icon, label }) => (
          <div key={label} className="glass-card flex items-center gap-3 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-left">{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {bullets.map((text) => (
          <div key={text} className="flex items-center gap-2 justify-center">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">{text}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Link to="/register">
          <Button className="w-full gradient-primary font-semibold gap-2 py-5">
            Começar grátis por 7 dias <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/login">
          <Button variant="outline" className="w-full border-border text-foreground mt-2">
            Já tenho conta
          </Button>
        </Link>
      </div>
    </motion.div>
  </div>
);

export default Splash;
