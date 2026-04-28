import { motion } from "framer-motion";
import { UserPlus, Calendar, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ActivationOnboardingProps {
  userName: string;
}

/**
 * Full-screen onboarding shown when user has 0 patients.
 * Focuses on immediate activation: "Cadastre seu primeiro paciente".
 */
const ActivationOnboarding = ({ userName }: ActivationOnboardingProps) => {
  const navigate = useNavigate();
  const firstName = userName?.split(" ")[0] || "Profissional";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <img loading="lazy" decoding="async" src="/pwa-icon-512.png" alt="SalbCare" className="h-14 w-14 mx-auto mb-4 object-contain" />
        <h1 className="text-2xl sm:text-3xl font-bold">
          Bem-vindo(a), {firstName}! 👋
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Vamos cadastrar seu primeiro paciente. Leva menos de 1 minuto.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Button
          size="lg"
          className="text-base px-8 py-6 rounded-xl font-bold gradient-primary gap-2"
          onClick={() => navigate("/dashboard/pacientes")}
        >
          <UserPlus className="h-5 w-5" />
          Cadastrar paciente
          <ArrowRight className="h-5 w-5" />
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="space-y-4 pt-4"
      >
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
          Em menos de 2 minutos você pode:
        </p>
        <div className="flex justify-center gap-8">
          {[
            { icon: UserPlus, label: "Cadastrar pacientes" },
            { icon: Calendar, label: "Organizar sua agenda" },
            { icon: FileText, label: "Registrar atendimentos" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground text-center leading-tight max-w-[90px]">
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ActivationOnboarding;
