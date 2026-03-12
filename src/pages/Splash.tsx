import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HeartPulse, ArrowRight, Shield, Calendar, Video, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Calendar, label: "Agenda inteligente" },
  { icon: Video, label: "Teleconsultas" },
  { icon: DollarSign, label: "Gestão financeira" },
  { icon: Shield, label: "Suporte jurídico" },
];

const Splash = () => (
  <div className="flex min-h-screen flex-col items-center justify-center px-6">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-sm space-y-10 text-center"
    >
      <div>
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-lg shadow-primary/20">
          <HeartPulse className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">SALBCARE</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          A plataforma completa para profissionais de saúde gerenciarem consultas, pacientes e finanças.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {features.map(({ icon: Icon, label }) => (
          <div key={label} className="glass-card flex items-center gap-2 p-3">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Link to="/register">
          <Button className="w-full gradient-primary font-semibold gap-2">
            Começar agora <ArrowRight className="h-4 w-4" />
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
