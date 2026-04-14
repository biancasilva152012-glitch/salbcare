import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Video, Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { parseBRL, maskCurrency } from "@/utils/currencyMask";

const fields = [
  { key: "agenda", label: "Gasto atual com Software de Agenda", placeholder: "150", icon: Calendar },
  { key: "video", label: "Gasto atual com Plataforma de Vídeo/Meet", placeholder: "80", icon: Video },
  { key: "gestao", label: "Gasto atual com Gestão/Contador", placeholder: "300", icon: Calculator },
] as const;

const SALBCARE_PRICE = 49;

/** Animated counter hook */
function useAnimatedNumber(target: number, duration = 600) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = display;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

const FreedomCalculator = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, string>>({
    agenda: "",
    video: "",
    gestao: "",
  });

  const update = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const { total, savings, hasSavings, hasInput } = useMemo(() => {
    const t = Object.values(values).reduce((s, v) => s + parseBRL(v), 0);
    const sav = t - SALBCARE_PRICE;
    return { total: t, savings: sav, hasSavings: sav > 0, hasInput: t > 0 };
  }, [values]);

  const animatedSavings = useAnimatedNumber(hasSavings ? savings : 0);
  const animatedAnnual = useAnimatedNumber(hasSavings ? savings * 12 : 0);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-md rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-6"
    >
      {/* Header */}
      <div className="space-y-1 text-center">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Quanto você economiza com a SalbCare?
        </h3>
        <p className="text-xs text-muted-foreground">
          Some seus gastos atuais e descubra
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        {fields.map(({ key, label, placeholder, icon: Icon }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Icon className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-9 flex items-center text-xs text-muted-foreground/50 font-medium">
                R$
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder={placeholder}
                value={values[key]}
                onChange={(e) => update(key, maskCurrency(e.target.value))}
                className="h-11 w-full rounded-xl border border-border/50 bg-accent/30 pl-16 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {hasInput && (
          <motion.div
            key="results"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2">
              <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

              {hasSavings ? (
                <>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm font-bold text-foreground"
                  >
                    Você está perdendo{" "}
                    <span className="text-destructive tabular-nums">{fmt(animatedSavings)}</span>{" "}
                    por mês.
                  </motion.p>
                  <p className="text-center text-xs text-muted-foreground leading-relaxed">
                    Com a SalbCare, o seu custo fixo cai para{" "}
                    <span className="font-semibold text-primary">R$ 49/mês</span>.
                  </p>
                  <p className="text-center text-[10px] text-muted-foreground/70">
                    Economia anual de{" "}
                    <span className="font-semibold text-primary tabular-nums">{fmt(animatedAnnual)}</span>
                  </p>
                </>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Seus gastos atuais já são menores que o plano SalbCare ({fmt(SALBCARE_PRICE)}/mês),
                  mas você ganha agenda, teleconsulta, financeiro e contabilidade — tudo integrado.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <Button
        onClick={() => navigate("/register")}
        size="lg"
        className="w-full gradient-primary font-semibold gap-2 rounded-xl h-12 text-sm shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
      >
        Parar de perder dinheiro agora
        <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
};

export default FreedomCalculator;
