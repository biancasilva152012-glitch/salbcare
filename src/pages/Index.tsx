import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Stethoscope, UserRound, Video, FileText, ClipboardCheck } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const floatingOrbs = [
  { size: 180, x: "8%", y: "10%", delay: 0 },
  { size: 120, x: "78%", y: "5%", delay: 1.5 },
  { size: 90, x: "70%", y: "75%", delay: 3 },
  { size: 60, x: "15%", y: "80%", delay: 2.5 },
];

const services = [
  { icon: Video, label: "Teleconsulta" },
  { icon: FileText, label: "Renovação de Receita" },
  { icon: ClipboardCheck, label: "Atestado Digital" },
];

const Index = () => {
  return (
    <>
      <SEOHead
        title="SALBCARE — Saúde Digital para Todos"
        description="Plataforma de teleconsulta, renovação de receita e atestado digital. Conecte-se a profissionais de saúde de forma rápida e segura."
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12 overflow-hidden">
        {/* Floating orbs */}
        {floatingOrbs.map((orb, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute rounded-full opacity-[0.07]"
            style={{
              width: orb.size,
              height: orb.size,
              left: orb.x,
              top: orb.y,
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
              filter: "blur(40px)",
            }}
            animate={{ y: [0, -20, 0, 15, 0], scale: [1, 1.1, 0.95, 1.05, 1] }}
            transition={{ duration: 14, repeat: Infinity, delay: orb.delay, ease: "easeInOut" }}
          />
        ))}

        <div className="relative z-10 w-full max-w-lg space-y-10">
          {/* Hero Section */}
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="mx-auto mb-2 h-20 w-20"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <img src="/pwa-icon-512.png" alt="SALBCARE" className="h-full w-full object-contain" />
            </motion.div>

            <h1 className="text-3xl font-bold tracking-tight">
              <span className="gradient-text">SALBCARE</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Saúde digital ao seu alcance. Conecte-se a profissionais de saúde de forma rápida e segura.
            </p>

            {/* Services badges */}
            <motion.div
              className="flex flex-wrap justify-center gap-2 pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {services.map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent/60 border border-border/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
                >
                  <s.icon className="h-3.5 w-3.5 text-primary" />
                  {s.label}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Profile Cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Patient Card */}
            <div className="glass-card p-6 space-y-4 flex flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <UserRound className="h-6 w-6 text-secondary" />
              </div>
              <div className="space-y-1 flex-1">
                <h2 className="text-lg font-bold">Paciente</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Encontre um profissional de saúde e agende sua consulta online agora mesmo.
                </p>
              </div>
              <Button
                asChild
                className="w-full h-11 font-semibold"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
              >
                <Link to="/pronto-atendimento">Quero me consultar</Link>
              </Button>
            </div>

            {/* Professional Card */}
            <div className="glass-card p-6 space-y-4 flex flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <h2 className="text-lg font-bold">Profissional de Saúde</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Acesse ou crie sua conta para gerenciar consultas, pacientes e finanças.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  className="w-full h-11 font-semibold"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
                >
                  <Link to="/login">Fazer Login</Link>
                </Button>
                <Button asChild variant="outline" className="w-full h-11 font-medium border-border/60">
                  <Link to="/register">Criar Conta</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Footer links */}
          <motion.div
            className="text-center space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Link
              to="/como-funciona"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Como funciona? →
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Index;
