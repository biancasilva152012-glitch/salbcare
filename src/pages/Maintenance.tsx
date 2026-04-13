import { motion } from "framer-motion";
import { Wrench } from "lucide-react";

const Maintenance = () => (
  <div className="flex min-h-screen flex-col items-center justify-center px-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm space-y-6 text-center"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
        <Wrench className="h-7 w-7 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold">Manutenção rápida</h1>
      <p className="text-sm text-muted-foreground leading-relaxed">
        A SalbCare está em manutenção rápida.<br />
        Voltamos em breve — normalmente em menos de 1 hora.
      </p>
      <div className="glass-card p-4 text-sm text-muted-foreground">
        Dúvidas? Fale com a gente:{" "}
        <a href="mailto:biancadealbuquerquep@gmail.com" className="text-primary hover:underline font-medium">
          biancadealbuquerquep@gmail.com
        </a>
      </div>
    </motion.div>
  </div>
);

export default Maintenance;
