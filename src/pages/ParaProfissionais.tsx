import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Search, Video, ArrowRight, MessageCircle, UserPlus, Globe, LayoutDashboard } from "lucide-react";
import { trackCtaClick } from "@/hooks/useTracking";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.12 } },
};

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
const DR_TYPES = new Set(["medico", "dentista"]);
const KNOWN_FEMALE = new Set(["sarah", "raquel", "mabel", "ingrid", "ruth", "miriam", "suelen", "gisele", "michele", "rachel", "deborah", "elizabeth", "karen", "megan", "jaqueline", "vivian", "lilian", "suzan"]);
const MALE_EXCEPTIONS = new Set(["luca", "josua", "nikita", "andrea"]);
const isFeminineName = (name: string) => {
  const first = name.split(" ")[0]?.toLowerCase() || "";
  if (MALE_EXCEPTIONS.has(first)) return false;
  if (KNOWN_FEMALE.has(first)) return true;
  return first.endsWith("a") || first.endsWith("e") || first.endsWith("ane") || first.endsWith("ene") || first.endsWith("ice") || first.endsWith("ilde") || first.endsWith("is");
};
const displayName = (name: string, type: string) => {
  if (!DR_TYPES.has(type)) return name;
  const lower = name.toLowerCase();
  if (lower.startsWith("dr.") || lower.startsWith("dra.") || lower.startsWith("dr(a)")) return name;
  const prefix = isFeminineName(name) ? "Dra." : "Dr.";
  return `${prefix} ${name}`;
};

const ParaProfissionais = () => {
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
        {/* ── Navbar ── */}
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-base font-bold text-foreground">SALBCARE</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/planos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Planos</Link>
              <Link to="/blog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
              <Link to="/login" className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors">Entrar</Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden px-4 pt-16 pb-16 text-center">
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
              Para profissionais de saúde autônomos.
            </motion.p>

            {/* Three value props */}
            <motion.div variants={fadeUp} className="mt-8 flex justify-center gap-6 sm:gap-12">
              {[
                { icon: FileText, label: "Mentoria financeira e contabilidade dos seus ganhos" },
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

            <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="text-base px-8 py-6 rounded-xl font-bold bg-[hsl(185,100%,39%)] hover:bg-[hsl(185,100%,34%)] text-[hsl(0,0%,100%)]">
                <Link to="/cadastro">
                  Começar grátis por 7 dias
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 rounded-xl font-semibold"
                onClick={() => {
                  document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' });
                  trackCtaClick("como_funciona", "hero");
                }}
              >
                Como funciona?
              </Button>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-2 text-center">
              <Link to="/login" className="text-xs text-primary/80 hover:text-primary transition-colors">
                Já é cadastrado? Faça login
              </Link>
            </motion.p>

            {/* IA Mentora Preview */}
            <motion.div variants={fadeUp} className="mt-8 max-w-xs mx-auto">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 text-center">IA Mentora em ação</p>
              <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 space-y-3 text-left">
                <div className="flex gap-2 items-start">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-primary font-bold">IA</span>
                  </div>
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl rounded-tl-none px-3 py-2 leading-relaxed">
                    Sua receita cresceu 12% este mês. Quer ver como otimizar seus impostos?
                  </p>
                </div>
                <div className="flex justify-end">
                  <p className="text-xs text-foreground bg-primary/10 rounded-xl rounded-tr-none px-3 py-2">
                    Sim, me mostre
                  </p>
                </div>
              </div>
            </motion.div>
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
        <section id="como-funciona" className="bg-muted/40 py-16 sm:py-24">
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
                  desc: "Agenda, prontuário, mentoria financeira e contabilidade dos seus ganhos na mesma plataforma",
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
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  initials: "SA",
                  name: "Sarah Almeida",
                  role: "Médica • Clínica Médica",
                  color: "bg-emerald-500",
                  quote: "A SalbCare organizou meu consultório digital do zero. Consigo gerenciar minha agenda, emitir receituários e atender com muito mais profissionalismo — tudo em uma plataforma só.",
                },
                {
                  initials: "MB",
                  name: "Mayara Barros",
                  role: "Terapeuta • Atende da Espanha para o Brasil",
                  color: "bg-violet-500",
                  quote: "Atendo meus pacientes brasileiros morando na Espanha sem nenhuma complicação. A teleconsulta integrada tornou isso simples e legal. Não consigo imaginar trabalhar sem a plataforma.",
                },
                {
                  initials: "CC",
                  name: "Cinara Costa",
                  role: "Dentista • HOF e Prontuários",
                  color: "bg-amber-500",
                  quote: "Faço a primeira avaliação de HOF e organizo todos os prontuários dos meus pacientes pela SalbCare. Ficou tudo centralizado, seguro e fácil de acessar a qualquer momento.",
                },
              ].map((t) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-border/40 bg-card/60 backdrop-blur-sm">
                    <CardContent className="p-6 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${t.color} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                          {t.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        "{t.quote}"
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Mentorship differentiator ── */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-md text-center space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-primary font-semibold">Por que não é só uma IA comum?</p>
            <p className="text-sm text-muted-foreground leading-relaxed text-center">
              Sua mentora financeira já conhece seus dados.
              Você pergunta e ela responde com base no que você de fato ganhou e gastou esse mês.
            </p>
            <p className="text-[11px] text-muted-foreground/70 text-center">
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
                                <p className="font-semibold text-sm">{displayName(prof.name, prof.professional_type)}</p>
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

        {/* ── CTA Final ── */}
        <section className="bg-muted/40 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-5 sm:px-6 text-center space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xl sm:text-2xl font-bold leading-snug"
            >
              Profissionais de saúde autônomos já usam a SalbCare para atender sem pagar comissão
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Button asChild size="lg" className="text-base px-8 py-6 rounded-xl font-bold bg-[hsl(185,100%,39%)] hover:bg-[hsl(185,100%,34%)] text-[hsl(0,0%,100%)] gap-2">
                <Link to="/planos" onClick={() => trackCtaClick("comecar_gratis_7dias", "cta_final")}>
                  Começar grátis por 7 dias
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
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
              <Link to="/blog" className="hover:text-foreground">Blog</Link>
              <a href="mailto:biancadealbuquerquep@gmail.com" className="hover:text-foreground">Fale com a gente</a>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SalbCare. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ParaProfissionais;
