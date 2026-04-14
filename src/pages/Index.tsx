import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X, FileText, Search, Video, UserPlus, Globe, LayoutDashboard } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <SEOHead
        title="SalbCare | Gestão e Saúde"
        description="Consultório digital para profissionais de saúde autônomos. Agenda, prontuário, teleconsulta e mentoria financeira. Sem comissão. 7 dias grátis."
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "SalbCare",
          url: "https://salbcare.com.br",
          description: "Consultório digital para profissionais de saúde. Sem comissão.",
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "89", priceCurrency: "BRL" },
        }}
      />

      <div className="min-h-screen bg-background">
        {/* ── Navbar ── */}
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2">
              <img src="/pwa-icon-512.png" alt="SALBCARE" className="h-8 w-8" width={32} height={32} />
              <span className="text-lg font-bold text-foreground">SALBCARE</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/para-profissionais" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Para Profissionais</Link>
              <Link to="/planos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Link to="/login">Já tenho conta</Link>
              </Button>
              <Button asChild size="sm" className="gradient-primary font-semibold">
                <Link to="/cadastro">Começar grátis</Link>
              </Button>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="md:hidden border-t border-border/40 bg-background px-4 py-4 space-y-3"
            >
              <Link to="/para-profissionais" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground">Para Profissionais</Link>
              <Link to="/planos" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground">Planos</Link>
              <div className="flex flex-col gap-2 pt-2">
                <Button asChild variant="outline" className="w-full border-border/60">
                  <Link to="/login">Já tenho conta</Link>
                </Button>
                <Button asChild className="w-full gradient-primary font-semibold">
                  <Link to="/cadastro">Começar grátis</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </nav>

        {/* ── Hero Section ── */}
        <section className="mx-auto max-w-6xl px-5 sm:px-6 pt-16 pb-16 sm:pt-28 sm:pb-24">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="text-center max-w-2xl mx-auto space-y-6"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                7 dias grátis • sem cartão
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight"
            >
              Seu consultório digital. Simples assim.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Para profissionais de saúde autônomos.
            </motion.p>

            {/* Three value props */}
            <motion.div variants={fadeUp} className="flex justify-center gap-6 sm:gap-12 pt-2">
              {[
                { icon: FileText, label: "Carnê-Leão preenchido automático" },
                { icon: Search, label: "Pacientes te encontram sem comissão" },
                { icon: Video, label: "Teleconsulta legal pelo Google Meet" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-1.5 max-w-[120px]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[11px] text-muted-foreground text-center leading-tight">{f.label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp}>
              <Button asChild size="lg" className="gradient-primary font-bold gap-2 h-14 px-10 rounded-xl text-base shadow-lg shadow-primary/20">
                <Link to="/cadastro">
                  Começar grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
            <motion.p variants={fadeUp} className="text-xs text-muted-foreground">
              R$ 89/mês após o período grátis. Sem comissão. Cancele quando quiser.
            </motion.p>
          </motion.div>
        </section>

        {/* ── Stats Bar ── */}
        <section className="bg-[hsl(var(--primary))] py-10">
          <div className="mx-auto max-w-4xl px-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { value: "9+", label: "especialidades" },
              { value: "100%", label: "das consultas pra você" },
              { value: "7 dias", label: "grátis sem cartão" },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-1"
              >
                <p className="text-3xl sm:text-4xl font-bold text-primary-foreground">{s.value}</p>
                <p className="text-sm text-primary-foreground/80">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Como Funciona ── */}
        <section className="bg-muted/40 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-5 sm:px-6">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-bold text-center mb-12"
            >
              Como funciona
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  icon: UserPlus,
                  title: "Cadastre seus dados de forma prática",
                  desc: "Tenha todo o seu diagnóstico financeiro na palma da mão",
                },
                {
                  step: "2",
                  icon: Globe,
                  title: "Pacientes te encontram",
                  desc: "Seu perfil aparece no diretório público da SalbCare sem custo por lead",
                },
                {
                  step: "3",
                  icon: LayoutDashboard,
                  title: "Gerencie tudo em um lugar",
                  desc: "Agenda, prontuário, receitas e financeiro na mesma plataforma",
                },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Number(item.step) * 0.1 }}
                  className="bg-background rounded-2xl p-6 sm:p-8 border border-border/40 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {item.step}
                    </span>
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Prova Social ── */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-5 sm:px-6">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-bold text-center mb-12"
            >
              O que dizem nossos profissionais
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  initials: "ST",
                  name: "Dra. Sarah T.",
                  role: "Médica",
                  color: "bg-emerald-500",
                  quote: "Finalmente uma plataforma que não fica com parte das minhas consultas.",
                },
                {
                  initials: "VF",
                  name: "Vitória F.",
                  role: "Dentista",
                  color: "bg-violet-500",
                  quote: "Configurei tudo em uma tarde. Já recebi meus primeiros pacientes.",
                },
                {
                  initials: "CC",
                  name: "Cinara C.",
                  role: "Nutricionista",
                  color: "bg-amber-500",
                  quote: "O Carnê-Leão sozinho já vale a assinatura inteira.",
                },
              ].map((t) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-background rounded-2xl p-6 border border-border/40 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${t.color} flex items-center justify-center text-sm font-bold text-white`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">"{t.quote}"</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border/30 py-8">
          <div className="mx-auto max-w-6xl px-4 text-center space-y-3">
            <p className="text-sm font-bold text-foreground">SALBCARE</p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground">Termos</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacidade</Link>
              <Link to="/planos" className="hover:text-foreground">Planos</Link>
              <Link to="/para-profissionais" className="hover:text-foreground">Para Profissionais</Link>
              <Link to="/blog" className="hover:text-foreground">Blog</Link>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SalbCare. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
