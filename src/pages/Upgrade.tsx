import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Check, ArrowRight, Lock, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import { useAuth } from "@/contexts/AuthContext";
import SEOHead from "@/components/SEOHead";
import { trackCtaClick } from "@/hooks/useTracking";
import { resolveUpgradeReason, buildCheckoutQuery } from "@/lib/upgradeReason";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const Upgrade = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reason = params.get("reason");
  const { user, subscription } = useAuth();
  const limits = useFreemiumLimits();

  // Mapeamento de reason → texto contextual. Aceita também variações vindas
  // do PremiumFeatureModal (ex: "Receitas e atestados digitais") via match
  // case-insensitive de palavras-chave.
  const reasonLabels: Record<string, { title: string; subtitle: string }> = {
    patients: {
      title: `Você atingiu o limite de ${limits.patientsLimit} pacientes do plano gratuito`,
      subtitle: "No plano Essencial você cadastra pacientes ilimitados.",
    },
    financial: {
      title: "Você atingiu o limite de lançamentos do mês",
      subtitle: "Lance receitas e despesas sem limite no plano Essencial.",
    },
    mentorship: {
      title: "Você atingiu o limite da mentoria com IA",
      subtitle: `No gratuito são ${limits.mentorshipLimit} mensagens/mês — no Essencial são ilimitadas.`,
    },
    telehealth: {
      title: "Teleconsulta é exclusiva do plano Essencial",
      subtitle: "Crie consultas online via Google Meet com link no seu perfil.",
    },
    prescriptions: {
      title: "Receitas digitais são exclusivas do plano Essencial",
      subtitle: "Emita Receita Comum, Controle Especial e Notificação Azul/Amarela com assinatura digital.",
    },
    certificates: {
      title: "Atestados digitais são exclusivos do plano Essencial",
      subtitle: "Emita atestados e certificados com hash de verificação e assinatura ICP.",
    },
    public_directory: {
      title: "Aparecer no diretório público é exclusivo do Essencial",
      subtitle: "Tenha um perfil destacado em /profissionais e receba pacientes da plataforma.",
    },
  };

  const matchedKey = resolveUpgradeReason(reason);

  const headline = matchedKey
    ? reasonLabels[matchedKey]
    : { title: "Desbloqueie tudo no Essencial", subtitle: "R$ 89/mês • 7 dias grátis • Cancele quando quiser." };

  const planName = subscription.subscribed ? "Essencial" : (subscription.trialDaysRemaining > 0 ? "Trial" : "Grátis");

  const usageItems = [
    {
      key: "patients",
      label: "Pacientes",
      count: limits.patientsCount,
      limit: limits.patientsLimit,
      blocked: !limits.canAddPatient,
    },
    {
      key: "financial",
      label: "Lançamentos no mês",
      count: limits.financialCount,
      limit: limits.financialLimit,
      blocked: !limits.canAddFinancial,
    },
    {
      key: "mentorship",
      label: "Mensagens de mentoria",
      count: limits.mentorshipCount,
      limit: limits.mentorshipLimit,
      blocked: !limits.canSendMentorship,
    },
  ];

  const benefits = [
    { text: "Pacientes ilimitados", icon: Check },
    { text: "Lançamentos financeiros ilimitados", icon: Check },
    { text: "Mentoria com IA ilimitada", icon: Sparkles, highlight: true },
    { text: "Teleconsulta via Google Meet", icon: Check },
    { text: "Perfil público pesquisável no diretório", icon: Check },
    { text: "100% do valor das consultas (sem comissão)", icon: Check },
    { text: "Suporte prioritário no WhatsApp", icon: Check },
  ];

  const goCheckout = () => {
    trackCtaClick("upgrade_essencial", `upgrade_page_${matchedKey || reason || "generic"}`);
    // Pré-seleciona o plano Essencial e propaga o motivo para o checkout
    navigate(`/checkout?${buildCheckoutQuery(matchedKey, reason)}`);
  };

  return (
    <>
      <SEOHead
        title="Fazer upgrade | SalbCare"
        description="Desbloqueie pacientes ilimitados, mentoria com IA e teleconsulta no plano Essencial. R$ 89/mês."
        canonical="/upgrade"
      />
      <div className="min-h-screen bg-background font-['Plus_Jakarta_Sans',sans-serif] px-4 py-8 sm:py-12">
        <motion.div
          className="mx-auto w-full max-w-md space-y-5"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold leading-tight">{headline.title}</h1>
            <p className="text-sm text-muted-foreground">{headline.subtitle}</p>
          </motion.div>

          {/* Current plan */}
          {user && (
            <motion.div variants={fadeUp} className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Seu plano atual</p>
                  <p className="text-base font-bold">{planName}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${planName === "Essencial" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {planName === "Essencial" ? "Ativo" : "Limitado"}
                </span>
              </div>

              {limits.isFree && (
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Uso este mês</p>
                  {usageItems.map((u) => {
                    const pct = Math.min(100, (u.count / u.limit) * 100);
                    return (
                      <div key={u.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            {u.blocked && <Lock className="h-3 w-3 text-destructive" />}
                            {u.label}
                          </span>
                          <span className={`font-mono ${u.blocked ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                            {u.count}/{u.limit}
                          </span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* What you unlock */}
          <motion.div variants={fadeUp} className="glass-card p-5 space-y-4 ring-1 ring-primary/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-[11px] uppercase tracking-wider text-primary font-bold">O que você destrava</p>
            </div>
            <ul className="space-y-2.5">
              {benefits.map((b) => {
                const Icon = b.icon;
                return (
                  <li
                    key={b.text}
                    className={`flex items-center gap-2.5 text-sm ${b.highlight ? "bg-primary/5 -mx-1 px-2 py-1.5 rounded-lg" : ""}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${b.highlight ? "text-primary" : "text-primary/80"}`} />
                    <span className={b.highlight ? "font-semibold text-primary" : ""}>{b.text}</span>
                  </li>
                );
              })}
            </ul>

            <div className="pt-3 border-t border-border/40 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">R$ 89</span>
              <span className="text-sm text-muted-foreground">/mês</span>
              <span className="ml-auto text-[11px] text-muted-foreground">7 dias grátis</span>
            </div>

            <Button
              onClick={goCheckout}
              size="lg"
              className="w-full gradient-primary font-bold py-6 text-base"
            >
              <Crown className="h-4 w-4 mr-2" />
              Fazer upgrade agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Sem cartão para começar • Cancele quando quiser
            </p>
          </motion.div>

          {/* Secondary actions */}
          <motion.div variants={fadeUp} className="text-center space-y-2">
            <Link to="/planos" className="text-xs text-muted-foreground hover:text-primary hover:underline block">
              Comparar todos os planos
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Voltar
            </button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default Upgrade;
