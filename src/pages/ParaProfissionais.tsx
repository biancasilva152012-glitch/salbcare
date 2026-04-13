import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DollarSign, Compass, Video, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";

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

const ParaProfissionais = () => (
  <>
    <SEOHead
      title="Para Profissionais de Saúde | SalbCare"
      description="Seu consultório digital completo. Gerencie recebimentos, organize finanças e atenda por teleconsulta. Sem comissão. 7 dias grátis."
      canonical="/para-profissionais"
    />

    <div className="min-h-screen bg-background text-foreground font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-24 pb-16 text-center">
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
            className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Gerencie seus recebimentos, organize suas finanças e atenda por teleconsulta. Tudo em um lugar. Sem comissão.
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

          <motion.div variants={fadeUp} className="mt-8">
            <Button asChild size="lg" className="text-base px-8 py-6 rounded-xl gradient-primary font-bold">
              <Link to="/cadastro">
                Começar grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
          <motion.p variants={fadeUp} className="mt-3 text-xs text-muted-foreground">
            R$ 89/mês após o período grátis. Sem comissão. Cancele quando quiser.
          </motion.p>
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

      {/* ── Sticky mobile CTA ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-background/90 backdrop-blur-md border-t border-border/30 p-3 safe-area-pb">
        <Button asChild className="w-full py-5 text-base rounded-xl font-bold gradient-primary">
          <Link to="/cadastro">Começar grátis</Link>
        </Button>
      </div>
    </div>
  </>
);

export default ParaProfissionais;
