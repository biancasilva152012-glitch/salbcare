import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const features = [
  { text: "Contador financeiro mensal", highlight: false },
  { text: "Mentoria financeira com IA ilimitada", highlight: true },
  { text: "Teleconsulta via Google Meet", highlight: false },
  { text: "Perfil público pesquisável", highlight: false },
  { text: "Link de indicação para colegas", highlight: false },
  { text: "Sem comissão sobre consultas", highlight: false },
];

const Subscription = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <SEOHead
        title="Planos | SalbCare"
        description="Um plano. Tudo que você precisa. Sem comissão. Sem taxa por consulta. A partir de R$69/mês."
        canonical="/planos"
      />
      <div className="min-h-screen bg-background font-['Plus_Jakarta_Sans',sans-serif] flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          className="w-full max-w-md text-center space-y-6"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fadeUp} className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Um plano. Tudo que você precisa.</h1>
            <p className="text-sm text-muted-foreground">
              Sem comissão. Sem taxa por consulta. Você fica com 100% do que recebe.
            </p>
          </motion.div>

          {/* Period toggle */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted/50 p-1 border border-border/40">
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${!annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Anual (-22%)
              </button>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="glass-card p-6 sm:p-8 space-y-5 ring-1 ring-primary/30">
            <div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
                7 dias grátis
              </span>
              <h2 className="text-lg font-bold">SalbCare Essencial</h2>
            </div>

            <div>
              {annual ? (
                <>
                  <span className="text-lg text-muted-foreground line-through mr-2">R$ 89</span>
                  <span className="text-4xl font-bold text-primary">R$ 69</span>
                  <span className="text-muted-foreground">/mês</span>
                  <p className="text-xs text-primary font-semibold mt-1">R$ 828/ano • Economia de R$ 240</p>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold text-primary">R$ 89</span>
                  <span className="text-muted-foreground">/mês</span>
                  <p className="text-xs text-muted-foreground mt-1">cobrado mensalmente</p>
                </>
              )}
            </div>

            <ul className="space-y-2.5 text-left">
              {features.map((f) => (
                <li key={f.text} className={`flex items-center gap-2 text-sm ${f.highlight ? "bg-primary/5 -mx-1 px-1 py-1 rounded-lg" : ""}`}>
                  {f.highlight ? (
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <span className={f.highlight ? "font-semibold text-primary" : ""}>{f.text}</span>
                </li>
              ))}
            </ul>

            <Button asChild size="lg" className="w-full text-base py-6 rounded-xl font-bold gradient-primary">
              <Link to="/cadastro">
                Começar 7 dias grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Sem cartão de crédito para começar. Cancele quando quiser.
            </p>
          </motion.div>

          <motion.p variants={fadeUp} className="text-xs text-muted-foreground">
            Tem uma clínica ou grupo de profissionais?{" "}
            <a href="mailto:biancadealbuquerquep@gmail.com" className="text-primary hover:underline">Fale com a gente</a>
          </motion.p>
        </motion.div>
      </div>
    </>
  );
};

export default Subscription;
