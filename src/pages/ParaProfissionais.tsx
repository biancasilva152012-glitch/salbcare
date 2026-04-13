import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Compass, Video, ArrowRight, Star, MessageCircle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.12 } },
};

const testimonials = [
  {
    name: "Sarah Almeida",
    specialty: "Médica — Clínica Médica",
    stars: 5,
    text: "A SalbCare organizou meu consultório digital do zero. Consigo gerenciar minha agenda, emitir receituários e atender com muito mais profissionalismo.",
  },
  {
    name: "Mayara Barros",
    specialty: "Terapeuta — Atende da Espanha para o Brasil",
    stars: 5,
    text: "Atendo meus pacientes brasileiros morando na Espanha sem nenhuma complicação. A teleconsulta integrada tornou isso simples e legal.",
  },
  {
    name: "Cinara Costa",
    specialty: "Dentista — HOF e Prontuários",
    stars: 5,
    text: "Faço a primeira avaliação de HOF e organizo todos os prontuários dos meus pacientes pela SalbCare. Ficou tudo centralizado e seguro.",
  },
];

const professionalLabels: Record<string, string> = {
  medico: "Médico(a)",
  psicologo: "Psicólogo(a)",
  nutricionista: "Nutricionista",
  fisioterapeuta: "Fisioterapeuta",
  fonoaudiologo: "Fonoaudiólogo(a)",
  dentista: "Cirurgião(ã)-Dentista",
  outro: "Profissional de Saúde",
};

const HIGHLIGHT_TYPES = ["medico", "dentista", "psicologo"];

const ParaProfissionais = () => {
  const [bannerVisible, setBannerVisible] = useState(true);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  // Show floating CTA after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowFloatingCta(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Hide banner on 80% scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.8) setBannerVisible(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: professionals = [] } = useQuery({
    queryKey: ["public-professionals-landing"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_professionals");
      return data || [];
    },
  });

  const highlighted = HIGHLIGHT_TYPES.map((type) =>
    professionals.find((p: any) => p.professional_type === type)
  ).filter(Boolean).slice(0, 3);

  return (
    <>
      <SEOHead
        title="SalbCare | A Clínica Digital Popular do Brasil"
        description="Plataforma completa para profissionais de saúde autônomos. Captação de pacientes, teleconsulta, prontuário digital e gestão fiscal. Teste grátis por 7 dias."
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "SalbCare",
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          url: "https://salbcare.com.br",
          offers: { "@type": "Offer", price: "89", priceCurrency: "BRL" },
        }}
      />

      <div className="min-h-screen bg-background text-foreground font-['Plus_Jakarta_Sans',sans-serif]">
        {/* ── Promo Banner ── */}
        <AnimatePresence>
          {bannerVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 44, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[hsl(222,47%,11%)] text-[hsl(210,40%,98%)] flex items-center justify-center text-xs sm:text-sm font-medium relative z-50"
            >
              <span>🎉 7 dias grátis para novos profissionais — sem cartão de crédito</span>
              <button
                onClick={() => setBannerVisible(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70"
                aria-label="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden px-4 pt-20 pb-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
          <motion.div
            className="relative mx-auto max-w-2xl"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-4">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                7 dias grátis • sem cartão
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight"
            >
              Sua <span className="text-primary">vitrine</span> para pacientes.
              <br />
              Seu <span className="text-primary">controle</span> para gestão.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto text-center"
            >
              100% das consultas para você. Zero comissão.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto text-center"
            >
              Para psicólogos, terapeutas, nutricionistas, fisioterapeutas, médicos e todos os profissionais de saúde autônomos.
            </motion.p>

            {/* Three icons */}
            <motion.div variants={fadeUp} className="mt-8 flex justify-center gap-8 sm:gap-12">
              {[
                { icon: DollarSign, label: "Contador financeiro" },
                { icon: Compass, label: "Mentoria de organização" },
                { icon: Video, label: "Teleconsulta via Google Meet" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-1.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[11px] text-muted-foreground text-center leading-tight max-w-[90px]">{f.label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="text-base px-8 py-6 rounded-xl font-bold bg-[hsl(185,100%,39%)] hover:bg-[hsl(185,100%,34%)] text-[hsl(0,0%,100%)]">
                <Link to="/cadastro">
                  Começar grátis por 7 dias
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 rounded-xl font-semibold">
                <Link to="/planos">Ver planos</Link>
              </Button>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-3 text-xs text-muted-foreground text-center">
              R$ 89/mês após o período grátis. Cancele quando quiser.
            </motion.p>
          </motion.div>
        </section>

        {/* ── Social Proof ── */}
        <section className="px-4 pb-16">
          <motion.div
            className="mx-auto max-w-4xl"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              className="text-xl sm:text-2xl font-bold mb-8 text-center"
            >
              O que dizem nossos profissionais
            </motion.h2>
            <div className="grid gap-5 sm:grid-cols-3">
              {testimonials.map((t) => (
                <motion.div key={t.name} variants={fadeUp}>
                  <Card className="h-full border-border/40 bg-card/60 backdrop-blur-sm">
                    <CardContent className="p-6 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.specialty}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.stars }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        "{t.text}"
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Mentorship differentiator ── */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-md text-center space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-primary font-semibold">Por que não é só uma IA comum?</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sua mentora financeira já conhece seus dados.
              Você pergunta — ela responde com base no que você de fato ganhou e gastou esse mês.
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              Diferente do ChatGPT, ela não responde no genérico. Ela responde sobre você.
            </p>
          </div>
        </section>

        {/* ── Public Directory ── */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-8 space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold">
                Encontre seu profissional de saúde
              </h2>
              <p className="text-sm text-muted-foreground text-center">
                Sem cadastro. Encontre e entre em contato direto.
              </p>
            </div>

            {highlighted.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">Nenhum profissional disponível no momento.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {highlighted.map((prof: any) => {
                    const label = professionalLabels[prof.professional_type] || "Profissional";
                    const slug = prof.name
                      ?.toLowerCase()
                      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9\s-]/g, "")
                      .replace(/\s+/g, "-")
                      .replace(/-+/g, "-")
                      .trim();

                    return (
                      <div key={prof.user_id}>
                        <Card className="h-full border-border/40 hover:border-primary/30 transition-colors">
                          <CardContent className="p-5 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {prof.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{prof.name}</p>
                                <Badge variant="secondary" className="text-xs mt-0.5">{label}</Badge>
                              </div>
                            </div>
                            {prof.bio && <p className="text-xs text-muted-foreground line-clamp-2">{prof.bio}</p>}
                            <Button asChild size="sm" className="mt-auto gap-2 gradient-primary font-semibold">
                              <Link to={`/p/${slug}`}>
                                <MessageCircle className="h-4 w-4" />
                                Solicitar atendimento
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center mt-6">
                  <Button asChild variant="outline" className="gap-2">
                    <Link to="/profissionais">
                      Ver todos os profissionais
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </>
            )}
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
              <a href="mailto:biancadealbuquerquep@gmail.com" className="hover:text-foreground">Fale com a gente</a>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SalbCare. Todos os direitos reservados.</p>
          </div>
        </footer>

        {/* ── Sticky mobile CTA ── */}
        <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-background/90 backdrop-blur-md border-t border-border/30 p-3 safe-area-pb">
          <Button asChild className="w-full py-5 text-base rounded-xl font-bold bg-[hsl(185,100%,39%)] hover:bg-[hsl(185,100%,34%)] text-[hsl(0,0%,100%)]">
            <Link to="/cadastro">Começar grátis por 7 dias</Link>
          </Button>
        </div>

        {/* ── Floating CTA (mobile, after 5s) ── */}
        <AnimatePresence>
          {showFloatingCta && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed bottom-20 right-4 z-50 sm:hidden"
            >
              <Button asChild size="sm" className="rounded-full shadow-lg gap-2 bg-[hsl(185,100%,39%)] hover:bg-[hsl(185,100%,34%)] text-[hsl(0,0%,100%)] px-4 py-5">
                <Link to="/cadastro">
                  <Sparkles className="h-4 w-4" />
                  Criar conta grátis
                </Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ParaProfissionais;
