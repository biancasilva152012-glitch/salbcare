import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X, DollarSign, Compass, Video } from "lucide-react";
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
        title="SalbCare | Consultório Digital para Profissionais de Saúde"
        description="Gerencie seus recebimentos, organize suas finanças e atenda por teleconsulta. Sem comissão. 7 dias grátis."
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
              <Button asChild variant="outline" size="sm" className="border-border/60">
                <Link to="/login">Entrar</Link>
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
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button asChild className="w-full gradient-primary font-semibold">
                  <Link to="/cadastro">Começar grátis</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </nav>

        {/* ── Hero Section ── */}
        <section className="mx-auto max-w-6xl px-5 sm:px-6 pt-16 pb-20 sm:pt-28 sm:pb-32">
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
              Gerencie seus recebimentos, organize suas finanças e atenda por teleconsulta. Tudo em um lugar. Sem comissão.
            </motion.p>

            {/* Three icons */}
            <motion.div variants={fadeUp} className="flex justify-center gap-8 sm:gap-12 pt-2">
              {[
                { icon: DollarSign, label: "Contador financeiro" },
                { icon: Compass, label: "Mentoria financeira" },
                { icon: Video, label: "Teleconsulta" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-1.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{f.label}</span>
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

        {/* ── Footer ── */}
        <footer className="border-t border-border/30 py-8">
          <div className="mx-auto max-w-6xl px-4 text-center space-y-3">
            <p className="text-sm font-bold text-foreground">SALBCARE</p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground">Termos</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacidade</Link>
              <Link to="/planos" className="hover:text-foreground">Planos</Link>
              <Link to="/para-profissionais" className="hover:text-foreground">Para Profissionais</Link>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SalbCare. Todos os direitos reservados.</p>
          </div>
        </footer>

      </div>
    </>
  );
};

export default Index;
