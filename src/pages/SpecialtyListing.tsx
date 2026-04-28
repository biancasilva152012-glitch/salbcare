import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageSkeleton from "@/components/PageSkeleton";
import { motion } from "framer-motion";

const specialtyConfig: Record<string, { type: string; title: string; description: string; label: string }> = {
  psicologos: {
    type: "psicologo",
    title: "Psicólogos online",
    description: "Encontre psicólogos para atendimento online pela SalbCare.",
    label: "Psicólogo(a)",
  },
  nutricionistas: {
    type: "nutricionista",
    title: "Nutricionistas online",
    description: "Encontre nutricionistas para atendimento online pela SalbCare.",
    label: "Nutricionista",
  },
  medicos: {
    type: "medico",
    title: "Médicos online",
    description: "Encontre médicos para atendimento online pela SalbCare.",
    label: "Médico(a)",
  },
  fisioterapeutas: {
    type: "fisioterapeuta",
    title: "Fisioterapeutas online",
    description: "Encontre fisioterapeutas para atendimento online pela SalbCare.",
    label: "Fisioterapeuta",
  },
};

const SpecialtyListing = () => {
  const location = useLocation();
  const specialty = location.pathname.replace("/", "");
  const config = specialtyConfig[specialty] || null;

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["specialty-listing", config?.type],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_professionals", {
        specialty_filter: config!.type,
      });
      return data || [];
    },
    enabled: !!config,
  });

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Especialidade não encontrada</h1>
          <Button asChild><Link to="/">Voltar ao início</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${config.title} | SalbCare`}
        description={config.description}
        canonical={`/${specialty}`}
      />
      <div className="min-h-screen bg-background font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
          <div className="text-center mb-10 space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold">{config.title}</h1>
            <p className="text-muted-foreground">{config.description}</p>
          </div>

          {isLoading ? (
            <PageSkeleton variant="list" />
          ) : professionals.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Nenhum profissional disponível no momento.</p>
              <p className="text-sm text-muted-foreground mt-2">Novos profissionais são adicionados frequentemente.</p>
            </div>
          ) : (
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            >
              {professionals.map((prof: any) => {
                const slug = prof.name
                  ?.toLowerCase()
                  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9\s-]/g, "")
                  .replace(/\s+/g, "-")
                  .replace(/-+/g, "-")
                  .trim();

                return (
                  <motion.div
                    key={prof.user_id}
                    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  >
                    <Card className="h-full border-border/40 hover:border-primary/30 transition-colors">
                      <CardContent className="p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          {prof.avatar_url ? (
                            <img loading="lazy" decoding="async" src={prof.avatar_url} alt={prof.name} className="h-12 w-12 rounded-full object-cover" />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                              {prof.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm">{prof.name}</p>
                            <Badge variant="secondary" className="text-xs mt-0.5">{config.label}</Badge>
                          </div>
                        </div>
                        {prof.bio && <p className="text-xs text-muted-foreground line-clamp-2">{prof.bio}</p>}
                        {prof.consultation_price && (
                          <p className="text-sm font-semibold text-primary">
                            R$ {Number(prof.consultation_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        )}
                        <Button asChild variant="outline" size="sm" className="mt-auto">
                          <Link to={`/p/${slug}`}>Ver perfil</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          <div className="mt-12 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              ← Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SpecialtyListing;
