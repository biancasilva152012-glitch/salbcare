import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SPECIALTY_SEO } from "@/config/specialtyLegalNotices";

const SPECIALTIES = [
  { key: "medico", emoji: "🩺", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { key: "psicologo", emoji: "🧠", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { key: "nutricionista", emoji: "🥗", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
  { key: "dentista", emoji: "🦷", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  { key: "fisioterapeuta", emoji: "💪", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
];

const ConsultaOnlineIndex = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "Consulta Online — Agende com profissionais de saúde | SALBCARE";
    const meta = document.querySelector('meta[name="description"]');
    const content = "Agende sua consulta online com médicos, psicólogos, nutricionistas, dentistas e fisioterapeutas. Atendimento em todo o Brasil, sem sair de casa.";
    if (meta) meta.setAttribute("content", content);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
    return () => { document.title = "SALBCARE"; };
  }, []);

  const filtered = SPECIALTIES.filter((s) => {
    const seo = SPECIALTY_SEO[s.key];
    return seo?.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalBusiness",
            name: "SALBCARE — Consulta Online",
            description: "Plataforma de teleconsulta com profissionais de saúde habilitados em todo o Brasil.",
            url: "https://salbcare.lovable.app/consulta-online",
          }),
        }}
      />

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Consulta online com especialistas
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Profissionais habilitados, atendendo em todo o Brasil. Agende agora, sem sair de casa.
          </p>
        </motion.div>

        {/* Value proposition */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2 max-w-md mx-auto"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🚀</span>
            <p className="text-sm font-semibold text-foreground">A SALBCARE conecta você ao profissional ideal</p>
          </div>
          <ul className="space-y-1 text-[11px] text-muted-foreground pl-7">
            <li>✅ Encontre especialistas disponíveis hoje</li>
            <li>✅ Agende online em menos de 2 minutos</li>
            <li>✅ Atendimento 100% pela plataforma, seguro e prático</li>
            <li>✅ O profissional recebe 100% do valor da consulta</li>
            <li>✅ Sem downloads, sem cadastro — acesse pelo navegador</li>
          </ul>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-sm mx-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar especialidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-accent border-border pl-9"
          />
        </div>

        {/* Specialty Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid gap-3"
        >
          {filtered.map((spec, i) => {
            const seo = SPECIALTY_SEO[spec.key];
            if (!seo) return null;
            return (
              <motion.button
                key={spec.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/consulta-online/${spec.key}`)}
                className="glass-card p-4 flex items-center gap-4 text-left group hover:ring-1 hover:ring-primary/30 transition-all"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${spec.color}`}>
                  {spec.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{seo.title}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{seo.metaDescription}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </motion.button>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma especialidade encontrada.</p>
          )}
        </motion.div>

        {/* Footer */}
        <div className="text-center space-y-1 pt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            A SALBCARE é uma plataforma de gestão e não substitui orientação médica, jurídica ou contábil profissional.
          </p>
          <p className="text-[10px] text-muted-foreground/60">Powered by SALBCARE</p>
        </div>
      </div>
    </div>
  );
};

export default ConsultaOnlineIndex;
