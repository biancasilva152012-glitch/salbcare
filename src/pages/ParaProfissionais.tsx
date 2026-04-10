import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Video, FileText, Brain, Apple, Stethoscope, Activity, Ear, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.12 } },
};

const benefits = [
  {
    icon: Calendar,
    title: "Agenda Online",
    description: "Pacientes agendam direto pelo seu perfil público, 24h por dia",
  },
  {
    icon: Video,
    title: "Teleconsulta",
    description: "Consultas via Google Meet integradas à plataforma",
  },
  {
    icon: FileText,
    title: "Receituário Digital",
    description: "Emita receitas e atestados com validade legal",
  },
];

const specialties = [
  { label: "Psicologia", icon: Brain },
  { label: "Nutrição", icon: Apple },
  { label: "Medicina", icon: Stethoscope },
  { label: "Fisioterapia", icon: Activity },
  { label: "Fonoaudiologia", icon: Ear },
];

const testimonials = [
  {
    name: "Sarah Almeida",
    specialty: "Médica • Clínica Médica",
    stars: 5,
    text: "A SalbCare organizou meu consultório digital do zero. Consigo gerenciar minha agenda, emitir receituários e atender com muito mais profissionalismo — tudo em uma plataforma só.",
  },
  {
    name: "Mayara Barros",
    specialty: "Terapeuta • Atende da Espanha para o Brasil",
    stars: 5,
    text: "Atendo meus pacientes brasileiros morando na Espanha sem nenhuma complicação. A teleconsulta integrada tornou isso simples e legal. Não consigo imaginar trabalhar sem a plataforma.",
  },
  {
    name: "Cinara Costa",
    specialty: "Dentista • HOF e Prontuários",
    stars: 5,
    text: "Faço a primeira avaliação de HOF e organizo todos os prontuários dos meus pacientes pela SalbCare. Ficou tudo centralizado, seguro e fácil de acessar a qualquer momento.",
  },
];

const faqItems = [
  {
    q: "Quanto custa?",
    a: "Plano fixo mensal, sem comissão sobre consultas. Você fica com 100% do que recebe.",
  },
  {
    q: "Posso atender por telemedicina?",
    a: "Sim, dentro das normas do CFM e dos conselhos de saúde.",
  },
  {
    q: "Como funciona o teste grátis?",
    a: "7 dias grátis, sem precisar de cartão de crédito para começar.",
  },
  {
    q: "Preciso ter CNPJ?",
    a: "Não. A SalbCare funciona para autônomos com ou sem CNPJ.",
  },
  {
    q: "Como os pacientes me encontram?",
    a: "Você terá um perfil público pesquisável dentro da plataforma.",
  },
];

const ParaProfissionais = () => (
  <>
    <SEOHead
      title="Para Profissionais de Saúde | SalbCare"
      description="Seu consultório digital completo. Atenda online, gerencie sua agenda e emita receituários. Sem comissão. Plano fixo. Teste grátis 7 dias."
      canonical="/para-profissionais"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Para Profissionais de Saúde",
        description: "Consultório digital completo para profissionais de saúde autônomos.",
      }}
    />

    <div className="min-h-screen bg-background text-foreground font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-24 pb-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <motion.div
          className="relative mx-auto max-w-2xl"
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          <motion.h1
            variants={fadeUp}
            className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight"
          >
            Seu consultório digital completo
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Atenda online, gerencie sua agenda e emita receituários — tudo em um lugar.
            Sem comissão. Plano fixo.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8">
            <Button asChild size="lg" className="text-base px-8 py-6 rounded-xl">
              <Link to="/register">
                Começar teste grátis de 7 dias
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Benefits ── */}
      <section className="px-4 pb-16">
        <motion.div
          className="mx-auto max-w-4xl grid gap-5 sm:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          {benefits.map((b) => (
            <motion.div key={b.title} variants={fadeUp}>
              <Card className="h-full border-border/40 bg-card/60 backdrop-blur-sm">
                <CardContent className="p-6 flex flex-col items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <b.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Specialties ── */}
      <section className="px-4 pb-16 text-center">
        <motion.h2
          className="text-xl sm:text-2xl font-bold mb-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          Para diversas especialidades
        </motion.h2>
        <motion.div
          className="flex flex-wrap justify-center gap-3 mx-auto max-w-xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          {specialties.map((s) => (
            <motion.div key={s.label} variants={fadeUp}>
              <Badge
                variant="secondary"
                className="text-sm py-2 px-4 gap-1.5 font-medium"
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-4 pb-16">
        <motion.div
          className="mx-auto max-w-4xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
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
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      "{t.text}"
                    </p>
                    <div className="mt-auto pt-3 border-t border-border/30">
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.specialty}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 pb-16">
        <motion.div
          className="mx-auto max-w-2xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeUp}
            className="text-xl sm:text-2xl font-bold mb-6 text-center"
          >
            Perguntas frequentes
          </motion.h2>
          <motion.div variants={fadeUp}>
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border/40 rounded-xl px-4 bg-card/40"
                >
                  <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 pb-24 text-center">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <Button asChild size="lg" className="text-base px-8 py-6 rounded-xl">
            <Link to="/register">
              Começar teste grátis de 7 dias
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* ── Sticky mobile CTA ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-background/90 backdrop-blur-md border-t border-border/30 p-3 safe-area-pb">
        <Button asChild className="w-full py-5 text-base rounded-xl font-bold">
          <Link to="/register">Começar teste grátis de 7 dias</Link>
        </Button>
      </div>
    </div>
  </>
);

export default ParaProfissionais;
