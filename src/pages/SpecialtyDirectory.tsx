import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Clock, User, Search, CalendarCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SPECIALTY_SEO, SPECIALTY_LEGAL_NOTICES } from "@/config/specialtyLegalNotices";
import { PROFESSION_CONFIG } from "@/config/professions";
import SEOHead from "@/components/SEOHead";

type Filter = "all" | "today" | "week" | "top_rated";

const DAY_MAP: Record<number, string> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };

function getNextAvailableSlot(availableHours: any): string | null {
  if (!availableHours || typeof availableHours !== "object") return null;
  const now = new Date();
  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const dayKey = DAY_MAP[d.getDay()];
    const slots = availableHours[dayKey];
    if (!slots || !Array.isArray(slots) || slots.length === 0) continue;
    const earliest = slots[0]?.start;
    if (!earliest) continue;
    if (offset === 0) {
      const [h, m] = earliest.split(":").map(Number);
      if (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes())) {
        const laterSlot = slots.find((s: any) => {
          const [sh] = s.start.split(":").map(Number);
          return sh > now.getHours();
        });
        if (!laterSlot) continue;
        return `Hoje às ${laterSlot.start}`;
      }
      return `Hoje às ${earliest}`;
    }
    if (offset === 1) return `Amanhã às ${earliest}`;
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return `${dayNames[d.getDay()]} às ${earliest}`;
  }
  return null;
}

function isAvailableToday(availableHours: any): boolean {
  if (!availableHours) return false;
  const dayKey = DAY_MAP[new Date().getDay()];
  const slots = availableHours[dayKey];
  return Array.isArray(slots) && slots.length > 0;
}

function isAvailableThisWeek(availableHours: any): boolean {
  if (!availableHours) return false;
  const now = new Date();
  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const dayKey = DAY_MAP[d.getDay()];
    const slots = availableHours[dayKey];
    if (Array.isArray(slots) && slots.length > 0) return true;
  }
  return false;
}

const SpecialtyDirectory = () => {
  const { specialty } = useParams<{ specialty: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const seo = specialty ? SPECIALTY_SEO[specialty] : null;
  const legalNotice = specialty ? SPECIALTY_LEGAL_NOTICES[specialty] : null;
  const professionConfig = specialty ? PROFESSION_CONFIG[specialty as keyof typeof PROFESSION_CONFIG] : null;


  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["public-professionals", specialty],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_professionals", {
        specialty_filter: specialty || null,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!specialty,
  });

  const filtered = useMemo(() => {
    let list = professionals.filter((p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    if (filter === "today") list = list.filter((p: any) => isAvailableToday(p.available_hours));
    if (filter === "week") list = list.filter((p: any) => isAvailableThisWeek(p.available_hours));
    if (filter === "top_rated") list = [...list]; // all shown, sorted below
    return list;
  }, [professionals, search, filter]);

  if (!seo || !specialty) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">Especialidade não encontrada</h1>
          <Button onClick={() => navigate("/")} variant="outline">Voltar</Button>
        </div>
      </div>
    );
  }

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const cityFromTz = tz.split("/").pop()?.replace(/_/g, " ") || tz;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${seo.metaTitle} | SalbCare`}
        description={seo.metaDescription}
        canonical={`/consulta-online/${specialty}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: `Consulta Online com ${seo.title} — SalbCare`,
          description: seo.metaDescription,
          url: `https://salbcare.com.br/consulta-online/${specialty}`,
        }}
      />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            Consulta online com {seo.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Profissionais habilitados, atendendo em todo o Brasil. Agende agora, sem sair de casa.
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            🕐 Todos os horários estão no fuso de {cityFromTz}
          </p>
        </motion.div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1 bg-accent rounded-full px-2.5 py-1">✅ Sem cadastro</span>
          <span className="flex items-center gap-1 bg-accent rounded-full px-2.5 py-1">🔒 Consulta segura</span>
          <span className="flex items-center gap-1 bg-accent rounded-full px-2.5 py-1">📱 Pelo navegador</span>
          <span className="flex items-center gap-1 bg-accent rounded-full px-2.5 py-1">⚡ Agende em 2 min</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar profissional..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-accent border-border pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {([
            { key: "all", label: "Todos", icon: null },
            { key: "today", label: "Disponível hoje", icon: CalendarCheck },
            { key: "week", label: "Esta semana", icon: Clock },
            { key: "top_rated", label: "Melhor avaliado", icon: TrendingUp },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {label}
            </button>
          ))}
        </div>

        {/* Professionals Grid */}
        {isLoading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-4 animate-pulse h-28" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <User className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Nenhum profissional disponível no momento.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-3"
          >
            {filtered.map((prof: any) => {
              const nextSlot = getNextAvailableSlot(prof.available_hours);
              const councilPrefix = professionConfig?.councilPrefix || "CRM";
              return (
                <div key={prof.user_id} className="glass-card p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {prof.avatar_url ? (
                        <img
                          src={prof.avatar_url}
                          alt={prof.name}
                          className="h-12 w-12 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        prof.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join("")
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div>
                        <p className="text-sm font-semibold truncate">{prof.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {seo.title} • {councilPrefix} {prof.crm || "—"}
                        </p>
                      </div>

                      {nextSlot && (
                        <div className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
                          <Clock className="h-3 w-3" />
                          Próximo horário: {nextSlot}
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0.5 text-[11px] text-amber-500">
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                        {prof.consultation_price && (
                          <span className="text-[11px] font-medium text-foreground">
                            R$ {Number(prof.consultation_price).toFixed(0)} / consulta
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <Button
                      size="sm"
                      className="shrink-0 gradient-primary text-xs"
                      onClick={() =>
                        navigate(
                          `/booking?doctor=${prof.user_id}&name=${encodeURIComponent(prof.name)}`
                        )
                      }
                    >
                      Agendar
                    </Button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Legal Notice */}
        {legalNotice && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border p-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {legalNotice}
            </p>
          </div>
        )}

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

export default SpecialtyDirectory;
