import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  UserRound,
  Video,
  FileText,
  Calendar,
  DollarSign,
  Calculator,
  UserSearch,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import FreedomCalculator from "@/components/financial/FreedomCalculator";
import { PLANS } from "@/config/plans";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const planCards = [
  {
    key: "basic" as const,
    popular: true,
  },
  {
    key: "professional" as const,
    popular: false,
  },
  {
    key: "clinic" as const,
    popular: false,
  },
];

const annualPrices: Record<string, { total: number; original: number; savings: number }> = {
  basic: { total: 470, original: 588, savings: 118 },
  professional: { total: 950, original: 1188, savings: 238 },
  clinic: { total: 1814, original: 2268, savings: 454 },
};

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <>
      <SEOHead
        title="SalbCare | Gestão e Captação para Profissionais de Saúde"
        description="A plataforma completa para médicos, psicólogos e dentistas. Agenda, financeiro e captação por R$ 49/mês. Teste grátis!"
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "SalbCare",
          "url": "https://salbcare.com.br",
          "description": "A plataforma completa para médicos, psicólogos e dentistas. Agenda, financeiro e captação por R$ 49/mês.",
          "applicationCategory": "HealthApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "49",
            "priceCurrency": "BRL"
          }
        }}
      />

      <div className="min-h-screen bg-background">
        {/* ── Navbar ── */}
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2">
              <img src="/pwa-icon-512.png" alt="SALBCARE" className="h-8 w-8" />
              <span className="text-lg font-bold gradient-text">SALBCARE</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
              <a href="#planos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
              <a href="#pacientes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Para Pacientes</a>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="border-border/60">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="gradient-primary font-semibold">
                <Link to="/register">Criar Conta Grátis</Link>
              </Button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="md:hidden border-t border-border/40 bg-background px-4 py-4 space-y-3"
            >
              <a href="#recursos" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground">Recursos</a>
              <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground">Planos</a>
              <a href="#pacientes" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground">Para Pacientes</a>
              <div className="flex flex-col gap-2 pt-2">
                <Button asChild variant="outline" className="w-full border-border/60">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button asChild className="w-full gradient-primary font-semibold">
                  <Link to="/register">Criar Conta Grátis</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </nav>

        {/* ── Hero Section ── */}
        <section className="mx-auto max-w-6xl px-5 sm:px-6 pt-12 pb-16 sm:pt-24 sm:pb-28">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:items-center"
          >
            <div className="space-y-6 text-center lg:text-left">
              <motion.h1
                variants={fadeUp}
                className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight"
              >
                Sua <span className="gradient-text">Vitrine</span> para Pacientes.{" "}
                <br className="hidden sm:block" />
                Seu <span className="gradient-text">Controle</span> para Gestão.
              </motion.h1>
              <motion.p variants={fadeUp} className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                O ecossistema completo para profissionais de saúde. Seja encontrado por novos pacientes e organize seu financeiro em um só lugar.{" "}
                <span className="font-semibold text-foreground">Tudo por R$ 49/mês.</span>
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button asChild size="lg" className="gradient-primary font-semibold gap-2 h-12 px-8 rounded-xl text-base shadow-lg shadow-primary/20">
                  <Link to="/register">
                    Começar 7 dias grátis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl text-base border-border/60">
                  <Link to="/como-funciona">Como funciona?</Link>
                </Button>
              </motion.div>
            </div>

            {/* Hero visual – overlapping cards mockup */}
            <motion.div variants={fadeUp} className="relative hidden lg:block">
              <div className="relative mx-auto w-full max-w-md">
                {/* Back card – Dashboard */}
                <div className="glass-card p-5 rounded-2xl rotate-2 translate-x-6 translate-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">Dashboard Financeiro</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Receita Mensal", value: "R$ 18.400" },
                      { label: "Consultas", value: "46" },
                      { label: "Valor/Consulta", value: "R$ 400" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg bg-accent/50 p-2.5 text-center">
                        <span className="text-[10px] text-muted-foreground">{m.label}</span>
                        <p className="text-xs font-bold mt-1 text-foreground">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Front card – Profile */}
                <div className="glass-card p-5 rounded-2xl -rotate-1 -translate-y-12 relative z-10 ring-1 ring-primary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Dra. Ana Costa</p>
                      <p className="text-[10px] text-muted-foreground">Dermatologista • CRM 12345</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">Online agora</span>
                    <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] text-muted-foreground">★ 4.9</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Pilar Duplo ── */}
        <section id="recursos" className="bg-accent/30 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="text-center mb-12 space-y-3"
            >
              <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold">
                Dois pilares, uma plataforma
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground max-w-md mx-auto">
                Tudo que o profissional de saúde precisa para crescer e se organizar.
              </motion.p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-6 md:grid-cols-2"
            >
              {/* Captação */}
              <motion.div variants={fadeUp} className="glass-card p-6 sm:p-8 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <UserSearch className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold">Atraia mais Pacientes</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Perfil profissional otimizado para buscas, agendamento online integrado e visibilidade no marketplace de saúde. Seus pacientes encontram você facilmente.
                </p>
                <ul className="space-y-2">
                  {["Perfil público profissional", "Agendamento online 24h", "Pronto Atendimento Digital"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Gestão */}
              <motion.div variants={fadeUp} className="glass-card p-6 sm:p-8 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Simplifique seu Negócio</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Prontuário digital, teleconsulta integrada e carnê-leão automático. Gerencie tudo sem sair da plataforma.
                </p>
                <ul className="space-y-2">
                  {["Prontuário eletrônico completo", "Teleconsulta por vídeo", "Controle financeiro e Carnê-Leão", "Assessoria jurídica", "Assessoria contábil especializada em saúde"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Calculadora de Liberdade ── */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="text-center mb-10 space-y-3"
            >
              <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold">
                Descubra quanto você economiza
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground max-w-md mx-auto">
                Some seus gastos atuais e veja a diferença
              </motion.p>
            </motion.div>
            <FreedomCalculator />
          </div>
        </section>

        {/* ── Pricing Table ── */}
        <section id="planos" className="bg-accent/30 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
              className="text-center mb-12 space-y-3"
            >
              <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold">
                Planos simples e transparentes
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground max-w-md mx-auto">
                Você fica com 100% do valor das suas consultas. Sempre.
              </motion.p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
              className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3"
            >
              {planCards.map(({ key, popular }) => {
                const plan = PLANS[key];
                return (
                  <motion.div
                    key={key}
                    variants={fadeUp}
                    className={`glass-card p-6 sm:p-8 space-y-5 relative flex flex-col ${popular ? "ring-2 ring-primary/60" : ""}`}
                  >
                    {popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 rounded-full gradient-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                          <Sparkles className="h-3 w-3" />
                          Mais Popular
                        </span>
                      </div>
                    )}
                    <div className="min-h-[60px]">
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{plan.subtitle}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">R$ {plan.price}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      size="lg"
                      className={`w-full rounded-xl h-12 font-semibold ${popular ? "gradient-primary shadow-lg shadow-primary/20" : ""}`}
                      variant={popular ? "default" : "outline"}
                    >
                      <Link to="/register">
                        {(plan as any).hasTrial ? "Começar 7 dias grátis" : "Escolher plano"}
                      </Link>
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ── Área do Paciente ── */}
        <section id="pacientes" className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
              className="glass-card p-8 sm:p-12 text-center space-y-5 max-w-2xl mx-auto"
            >
              <motion.div variants={fadeUp} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 mx-auto">
                <UserRound className="h-7 w-7 text-secondary" />
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-2xl font-bold">Você é paciente?</motion.h2>
              <motion.p variants={fadeUp} className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Encontre profissionais de saúde verificados, agende teleconsultas e acesse seu histórico — tudo gratuito.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="gradient-primary font-semibold gap-2 h-12 px-8 rounded-xl">
                  <Link to="/pronto-atendimento">
                    Encontre seu profissional
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl border-border/60">
                  <Link to="/meu-historico">Acesse seu histórico</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border/40 py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
            <div className="flex items-center justify-center gap-2">
              <img src="/pwa-icon-512.png" alt="SALBCARE" className="h-6 w-6" />
              <span className="text-sm font-bold gradient-text">SALBCARE</span>
            </div>
            <nav aria-label="Links do rodapé" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <Link to="/como-funciona" className="hover:text-foreground transition-colors">Como Funciona</Link>
              <Link to="/subscription" className="hover:text-foreground transition-colors">Planos</Link>
              <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
              <Link to="/pronto-atendimento" className="hover:text-foreground transition-colors">Para Pacientes</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Termos de Uso</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
              <a href="mailto:contato@salbcare.com.br" className="hover:text-foreground transition-colors">Contato</a>
            </nav>
            <div className="flex items-center justify-center gap-3">
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="gradient-primary font-semibold text-xs">
                <Link to="/register">Criar Conta</Link>
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground/60">
              © {new Date().getFullYear()} SALBCARE. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
