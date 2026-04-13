import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MessageCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import SEOHead from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const professionalLabels: Record<string, string> = {
  medico: "Médico(a)",
  psicologo: "Psicólogo(a)",
  nutricionista: "Nutricionista",
  fisioterapeuta: "Fisioterapeuta",
  fonoaudiologo: "Fonoaudiólogo(a)",
  dentista: "Cirurgião(ã)-Dentista",
  terapeuta_ocupacional: "Terapeuta Ocupacional",
  educador_fisico: "Educador(a) Físico(a)",
  outro: "Profissional de Saúde",
};

const categoryOrder = [
  "medico",
  "dentista",
  "psicologo",
  "nutricionista",
  "fisioterapeuta",
  "fonoaudiologo",
  "terapeuta_ocupacional",
  "educador_fisico",
  "outro",
];

const PublicProfessionals = () => {
  const [search, setSearch] = useState("");

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["public-professionals-all"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_professionals");
      return data || [];
    },
  });

  const filtered = professionals.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    (professionalLabels[p.professional_type] || "").toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = categoryOrder.reduce<Record<string, any[]>>((acc, type) => {
    const profs = filtered.filter((p: any) => p.professional_type === type);
    if (profs.length > 0) acc[type] = profs;
    return acc;
  }, {});

  // Catch any types not in categoryOrder
  const knownTypes = new Set(categoryOrder);
  const otherProfs = filtered.filter((p: any) => !knownTypes.has(p.professional_type));
  if (otherProfs.length > 0) {
    grouped["outro"] = [...(grouped["outro"] || []), ...otherProfs];
  }

  const makeSlug = (name: string) =>
    name
      ?.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Profissionais de Saúde | SalbCare"
        description="Encontre profissionais de saúde disponíveis para atendimento. Sem cadastro, sem complicação."
        canonical="/profissionais"
      />

      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">SALBCARE</span>
          </Link>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link to="/login">Entrar</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Profissionais de Saúde</h1>
          <p className="text-sm text-muted-foreground">
            Encontre e entre em contato direto. Sem intermediários.
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou especialidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-accent/50 border-border/60 pl-9 h-9 text-sm"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 w-32 rounded bg-muted animate-pulse" />
                <div className="h-16 rounded-lg bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">Nenhum profissional encontrado.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {Object.entries(grouped).map(([type, profs]) => (
              <section key={type} className="space-y-3">
                {/* Category header */}
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    {professionalLabels[type] || "Outros"}
                  </h2>
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-xs text-muted-foreground">{profs.length}</span>
                </div>

                {/* Professional rows */}
                <div className="space-y-2">
                  {profs.map((prof: any) => {
                    const slug = makeSlug(prof.name);
                    const initials = prof.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2);

                    return (
                      <Link
                        key={prof.user_id}
                        to={`/p/${slug}`}
                        className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-3.5 transition-all hover:border-primary/30 hover:bg-card group"
                      >
                        {/* Initials */}
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{prof.name}</p>
                          {prof.bio && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{prof.bio}</p>
                          )}
                        </div>

                        {/* CTA */}
                        <div className="shrink-0">
                          <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                            Ver perfil →
                          </span>
                          <MessageCircle className="h-4 w-4 text-primary sm:hidden" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </motion.div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-border/30 space-y-1">
          <p className="text-[10px] text-muted-foreground">
            A SALBCARE é uma plataforma de conexão e não substitui orientação médica profissional. O profissional define seus próprios valores e condições.
          </p>
          <p className="text-[10px] text-muted-foreground/60">Powered by SALBCARE</p>
        </div>
      </div>
    </div>
  );
};

export default PublicProfessionals;
