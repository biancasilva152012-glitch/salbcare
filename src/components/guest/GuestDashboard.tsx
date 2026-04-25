import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Users, DollarSign, Sparkles, Video, BookOpen, Scale, ArrowRight, Bell } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import GuestBanner from "@/components/GuestBanner";
import { Button } from "@/components/ui/button";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

/**
 * Guest variant of the Dashboard home — no Supabase queries.
 * Surfaces:
 * - GuestBanner with remaining quota + sign-up CTA
 * - Same quick-access grid as the authenticated dashboard
 * - Premium modules (mentoria, teleconsulta, financeiro, contabilidade,
 *   jurídico) navigate to the respective page which renders the GuestPaywall.
 */
const GuestDashboard = () => {
  const navigate = useNavigate();

  const quickAccess = [
    { icon: Users, label: "Pacientes", to: "/dashboard/pacientes", open: true },
    { icon: Calendar, label: "Agenda", to: "/dashboard/agenda", open: true },
    { icon: DollarSign, label: "Financeiro", to: "/dashboard/financial", open: false },
    { icon: BookOpen, label: "Contabilidade", to: "/dashboard/contabilidade", open: false },
    { icon: Video, label: "Teleconsulta", to: "/dashboard/teleconsulta", open: false },
    { icon: Scale, label: "Jurídico", to: "/dashboard/juridico", open: false },
  ];

  return (
    <PageContainer>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
        data-testid="guest-dashboard"
      >
        <motion.div variants={item}>
          <GuestBanner />
        </motion.div>

        {/* Insight do dia (visitante) — leva para login */}
        <motion.div variants={item}>
          <button
            onClick={() => navigate("/login?next=/dashboard")}
            className="glass-card w-full p-3 text-left transition-all active:scale-[0.98] hover:border-primary/50 flex items-start gap-3 border-primary/20 bg-primary/5"
          >
            <span className="text-xl">🤖</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Insight do dia</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Crie sua conta grátis para receber um diagnóstico financeiro personalizado da Mentora IA todos os dias.
              </p>
              <p className="text-[11px] font-semibold text-primary mt-1.5 inline-flex items-center gap-1">
                Entrar para ver <Sparkles className="h-3 w-3" />
              </p>
            </div>
          </button>
        </motion.div>

        {/* Ativar lembretes semanais (visitante) — leva para login */}
        <motion.div variants={item}>
          <div className="glass-card p-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">Ative lembretes semanais e insights do dia</p>
              <p className="text-[10px] text-muted-foreground">Disponível para profissionais com conta na SalbCare.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 text-xs"
              onClick={() => navigate("/login?next=/dashboard")}
            >
              Ativar
            </Button>
          </div>
        </motion.div>

        <motion.div variants={item} className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Bem-vindo(a)</p>
          <h1 className="text-xl font-bold sm:text-2xl">Visitante</h1>
        </motion.div>

        <motion.div variants={item}>
          <button
            onClick={() => navigate("/dashboard/mentoria")}
            className="glass-card w-full p-4 text-left transition-all active:scale-[0.98] hover:border-primary/50 flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Mentora Financeira com IA</p>
              <p className="text-xs text-muted-foreground">
                Disponível após criar sua conta grátis
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </motion.div>

        <motion.div variants={item}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Acesso rápido
          </p>
          <div className="grid grid-cols-3 gap-3">
            {quickAccess.map(({ icon: Icon, label, to, open }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="glass-card relative p-4 flex flex-col items-center gap-2 transition-all active:scale-[0.97] hover:border-primary/50"
              >
                {!open && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-semibold text-primary uppercase tracking-wider">
                    Conta
                  </span>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-center">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item}>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Já tenho conta — entrar</Link>
          </Button>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
};

export default GuestDashboard;
