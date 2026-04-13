import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DollarSign, Compass, Video, ArrowRight, Star, Search, MessageCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import SEOHead from "@/components/SEOHead";
import InstallBanner from "@/components/InstallBanner";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

const professionalLabels: Record<string, string> = {
  medico: "Médico(a)",
  psicologo: "Psicólogo(a)",
  nutricionista: "Nutricionista",
  fisioterapeuta: "Fisioterapeuta",
  fonoaudiologo: "Fonoaudiólogo(a)",
  dentista: "Cirurgião(ã)-Dentista",
  outro: "Profissional de Saúde",
};

const ParaProfissionais = () => {
  const [search, setSearch] = useState("");

  const { data: professionals = [] } = useQuery({
    queryKey: ["public-professionals-landing"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_professionals");
      return data || [];
    },
  });

  const filtered = professionals.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    (professionalLabels[p.professional_type] || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
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
              Para psicólogos, terapeutas, nutricionistas, fisioterapeutas, médicos e todos os profissionais de saúde autônomos. Sem CNPJ, sem comissão.
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

            <motion.p variants={fadeUp} className="mt-4 text-xs text-muted-foreground text-center">
              Não é só para médicos.
              <br />
              É para qualquer profissional.
            </motion.p>

            {/* Mentorship differentiator */}
            <motion.div variants={fadeUp} className="mt-8 text-center max-w-md mx-auto space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-primary font-semibold">Por que não é só uma IA comum?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sua mentora financeira já conhece seus dados.
                Você pergunta — ela responde com base no que você de fato ganhou e gastou esse mês.
                Sem precisar explicar nada do zero.
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                Diferente do ChatGPT, ela não responde no genérico. Ela responde sobre você.
              </p>
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

            {/* PWA Install Banner */}
            <motion.div variants={fadeUp} className="mt-6 max-w-md mx-auto">
              <InstallBanner />
            </motion.div>
          </motion.div>
        </section>

        {/* ── Public Directory ── */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-8 space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold">
                Encontre seu profissional de saúde
              </h2>
              <p className="text-sm text-muted-foreground">
                Sem cadastro. Encontre e entre em contato direto.
              </p>
            </div>

            {/* Search */}
            <div className="relative max-w-sm mx-auto mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou especialidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-accent border-border pl-9"
              />
            </div>

            {/* Professional cards */}
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">Nenhum profissional encontrado.</p>
                <p className="text-xs text-muted-foreground mt-1">Novos profissionais são adicionados frequentemente.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((prof: any) => {
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
                            {prof.avatar_url ? (
                              <img src={prof.avatar_url} alt={prof.name} className="h-12 w-12 rounded-full object-cover" />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {prof.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-sm">{prof.name}</p>
                              <Badge variant="secondary" className="text-xs mt-0.5">{label}</Badge>
                            </div>
                          </div>
                          {prof.bio && <p className="text-xs text-muted-foreground line-clamp-2">{prof.bio}</p>}
                          {prof.consultation_price && (
                            <p className="text-sm font-semibold text-primary">
                              R$ {Number(prof.consultation_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                          )}
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
            )}
          </div>
        </section>

        {/* ── Testimonials ── */}
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
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.stars }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        "{t.text}"
                      </p>
                      <div className="mt-auto pt-3">
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

        {/* ── Footer ── */}
        <div className="text-center space-y-1 py-8">
          <p className="text-[10px] text-muted-foreground">
            A SALBCARE é uma plataforma de gestão e não substitui orientação médica, jurídica ou contábil profissional.
          </p>
          <p className="text-[10px] text-muted-foreground/60">Powered by SALBCARE</p>
        </div>

        {/* ── Sticky mobile CTA ── */}
        <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-background/90 backdrop-blur-md border-t border-border/30 p-3 safe-area-pb">
          <Button asChild className="w-full py-5 text-base rounded-xl font-bold gradient-primary">
            <Link to="/cadastro">Começar grátis</Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default ParaProfissionais;
