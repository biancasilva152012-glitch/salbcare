import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, DollarSign, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    icon: UserCheck,
    title: "1. Complete seu perfil",
    text: "Preencha suas informações profissionais para que pacientes possam te encontrar no diretório público da SalbCare.",
    button: "Próximo",
    action: null,
  },
  {
    icon: DollarSign,
    title: "2. Registre seu primeiro recebimento",
    text: "Adicione um lançamento financeiro para que sua mentora com IA possa analisar seus dados e oferecer insights personalizados.",
    button: "Próximo",
    action: null,
  },
  {
    icon: Sparkles,
    title: "3. Conheça sua Mentora Financeira",
    text: "Sua IA mentora já conhece seus dados. Pergunte sobre impostos, preço de consulta ou reserva de emergência — ela responde sobre você, não no genérico.",
    button: "Começar agora",
    action: "/dashboard/mentoria",
  },
];

const WelcomeOnboarding = () => {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("salbcare_onboarding_done") === "true");
  const navigate = useNavigate();

  if (dismissed) return null;

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("salbcare_onboarding_done", "true");
      setDismissed(true);
      if (slides[step].action) {
        navigate(slides[step].action!);
      }
    }
  };

  const slide = slides[step];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.3 }}
          className="glass-card max-w-sm w-full p-8 text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary">
              <Icon className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">{slide.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{slide.text}</p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-2 bg-muted"}`}
              />
            ))}
          </div>

          <Button onClick={handleNext} className="w-full gradient-primary font-semibold">
            {slide.button}
          </Button>

          <button
            onClick={() => {
              localStorage.setItem("salbcare_onboarding_done", "true");
              setDismissed(true);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular tutorial
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default WelcomeOnboarding;
