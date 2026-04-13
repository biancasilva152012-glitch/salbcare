import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  outro: "Profissional de Saúde",
};

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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Profissionais de Saúde | SalbCare"
        description="Encontre profissionais de saúde disponíveis para atendimento. Sem cadastro, sem complicação. A SalbCare conecta você ao especialista ideal."
        canonical="/profissionais"
      />

      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/pwa-icon-512.png" alt="SALBCARE" className="h-7 w-7" />
            <span className="text-base font-bold text-foreground">SALBCARE</span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Entrar</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Profissionais de Saúde</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Encontre e entre em contato direto. A SalbCare é apenas uma ponte de conexão.
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-sm mx-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou especialidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-accent border-border pl-9"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Nenhum profissional encontrado.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
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
                <Card key={prof.user_id} className="h-full border-border/40 hover:border-primary/30 transition-colors">
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
              );
            })}
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center space-y-1 pt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            A SALBCARE é uma plataforma de conexão e não substitui orientação médica profissional. O profissional define seus próprios valores e condições de atendimento.
          </p>
          <p className="text-[10px] text-muted-foreground/60">Powered by SALBCARE</p>
        </div>
      </div>
    </div>
  );
};

export default PublicProfessionals;
