import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, Star, Clock, User, Stethoscope, FilePlus,
  Filter, Wifi, WifiOff, Bot, ChevronDown, MessageCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PROFESSION_CONFIG } from "@/config/professions";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import TriageChat from "@/components/triage/TriageChat";

const DAY_MAP: Record<number, string> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };

function isAvailableNow(availableHours: any): boolean {
  if (!availableHours) return false;
  const now = new Date();
  const dayKey = DAY_MAP[now.getDay()];
  const slots = availableHours[dayKey];
  if (!Array.isArray(slots) || slots.length === 0) return false;
  const currentMin = now.getHours() * 60 + now.getMinutes();
  return slots.some((s: any) => {
    const [sh, sm] = (s.start || "").split(":").map(Number);
    const [eh, em] = (s.end || "").split(":").map(Number);
    return currentMin >= sh * 60 + sm && currentMin < eh * 60 + em;
  });
}

function getNextAvailableSlot(availableHours: any): string | null {
  if (!availableHours || typeof availableHours !== "object") return null;
  const now = new Date();
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const dayKey = DAY_MAP[d.getDay()];
    const slots = availableHours[dayKey];
    if (!slots || !Array.isArray(slots) || slots.length === 0) continue;
    for (const s of slots) {
      const earliest = s?.start;
      if (!earliest) continue;
      if (offset === 0) {
        const [h, m] = earliest.split(":").map(Number);
        if (h * 60 + m <= now.getHours() * 60 + now.getMinutes()) continue;
        return `Hoje às ${earliest}`;
      }
      if (offset === 1) return `Amanhã às ${earliest}`;
      return `${dayNames[d.getDay()]} às ${earliest}`;
    }
  }
  return null;
}

type ServiceFilter = "all" | "prescription" | "consultation";
type AvailFilter = "all" | "available_now" | "today";
type SpecialtyFilter = string | "all";

const SERVICE_OPTIONS = [
  { key: "all" as const, label: "Todos", icon: Filter },
  { key: "prescription" as const, label: "Renovação de Receita", icon: FilePlus },
  { key: "consultation" as const, label: "Consulta", icon: Stethoscope },
];

const SPECIALTIES = [
  { key: "all", label: "Todas" },
  { key: "medico", label: "Médico" },
  { key: "dentista", label: "Cirurgião-Dentista" },
  { key: "psicologo", label: "Psicólogo" },
  { key: "nutricionista", label: "Nutricionista" },
  { key: "fisioterapeuta", label: "Fisioterapeuta" },
];

const INITIAL_VISIBLE = 3;

const ProntoAtendimento = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [availFilter, setAvailFilter] = useState<AvailFilter>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<SpecialtyFilter>("all");
  const [triageOpen, setTriageOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const queryClient = useQueryClient();

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["pronto-professionals"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_professionals", {
        specialty_filter: null,
      });
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("public-professionals-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pronto-professionals"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const filtered = useMemo(() => {
    let list = professionals as any[];
    if (search) {
      list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (specialtyFilter !== "all") {
      list = list.filter((p) => p.professional_type === specialtyFilter);
    }
    if (availFilter === "available_now") {
      list = list.filter((p) => isAvailableNow(p.available_hours));
    } else if (availFilter === "today") {
      const dayKey = DAY_MAP[new Date().getDay()];
      list = list.filter((p) => {
        const slots = p.available_hours?.[dayKey];
        return Array.isArray(slots) && slots.length > 0;
      });
    }
    return list;
  }, [professionals, search, specialtyFilter, availFilter]);

  // Reset showAll when filters change
  useEffect(() => {
    setShowAll(false);
  }, [search, specialtyFilter, availFilter]);

  const visibleProfessionals = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hasMore = filtered.length > INITIAL_VISIBLE;

  const openWhatsApp = (prof: any) => {
    const phone = (prof.phone || "").replace(/\D/g, "");
    if (!phone) {
      toast.error("Este profissional não possui WhatsApp cadastrado.");
      return;
    }
    const serviceLabel = serviceFilter === "consultation" ? "consulta online" : "atendimento";
    const msg = encodeURIComponent(
      `Olá, ${prof.name}! Encontrei seu perfil na SalbCare e gostaria de solicitar ${serviceLabel}. Poderia me ajudar?`
    );
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pronto Atendimento Online | SalbCare"
        description="Renove receitas, solicite atestados ou consulte especialistas de saúde online. Sem cadastro, sem fila."
        canonical="/pronto-atendimento"
      />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Teleconsulta Online
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Consulte especialistas de saúde online ou renove suas receitas. Sem cadastro, direto pelo navegador.
          </p>
        </motion.div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1 bg-accent rounded-full px-2.5 py-1">🔒 Seguro</span>
          <span className="flex items-center gap-1 bg-accent rounded-full px-2.5 py-1">📱 Pelo navegador</span>
          <span className="flex items-center gap-1 bg-accent rounded-full px-2.5 py-1">⚡ Rápido</span>
        </div>

        {/* Triage Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 border-primary/20 bg-primary/5"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-semibold">Não sabe qual especialidade você precisa?</p>
              <p className="text-xs text-muted-foreground">
                Me conte o que você está sentindo e eu te indico o profissional certo.
              </p>
              <Button size="sm" className="gradient-primary text-xs mt-1" onClick={() => setTriageOpen(true)}>
                🤖 Começar triagem gratuita
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Tipo de serviço:</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {SERVICE_OPTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setServiceFilter(key)}
                className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                  serviceFilter === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Specialty filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SPECIALTIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSpecialtyFilter(key)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
                specialtyFilter === key
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Availability filter + Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar profissional..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-accent border-border pl-9"
            />
          </div>
          <div className="flex gap-1">
            {([
              { key: "all" as const, label: "Todos" },
              { key: "available_now" as const, label: "Agora" },
              { key: "today" as const, label: "Hoje" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setAvailFilter(key)}
                className={`shrink-0 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors ${
                  availFilter === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Professionals list */}
        {isLoading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-4 animate-pulse h-32" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <User className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">Nenhum profissional disponível no momento.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
            {visibleProfessionals.map((prof: any) => {
              const config = PROFESSION_CONFIG[prof.professional_type as keyof typeof PROFESSION_CONFIG];
              const councilPrefix = config?.councilPrefix || "CRM";
              const availNow = isAvailableNow(prof.available_hours);
              const nextSlot = getNextAvailableSlot(prof.available_hours);
              

              return (
                <motion.div
                  key={prof.user_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm overflow-hidden">
                        {prof.avatar_url ? (
                          <img src={prof.avatar_url} alt={prof.name} className="h-14 w-14 rounded-full object-cover" loading="lazy" />
                        ) : (
                          prof.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")
                        )}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card ${availNow ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div>
                        <p className="text-sm font-semibold truncate">{prof.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {config?.label || prof.professional_type} • {councilPrefix} {prof.council_number || prof.crm || "—"}
                          {prof.council_state ? `-${prof.council_state}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {availNow ? (
                          <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-green-600 hover:bg-green-600">
                            <Wifi className="h-2.5 w-2.5 mr-1" />
                            Disponível agora
                          </Badge>
                        ) : nextSlot ? (
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                            <Clock className="h-2.5 w-2.5 mr-1" />
                            {nextSlot}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                            <WifiOff className="h-2.5 w-2.5 mr-1" />
                            Offline
                          </Badge>
                        )}

                      </div>

                      {prof.bio && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{prof.bio}</p>
                      )}

                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>

                    {/* CTA - WhatsApp */}
                    <Button
                      size="sm"
                      className="shrink-0 gradient-primary text-xs gap-1"
                      onClick={() => openWhatsApp(prof)}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Falar no<br />WhatsApp
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Show more button */}
        {!showAll && hasMore && !isLoading && (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setShowAll(true)}
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Ver mais profissionais ({filtered.length - INITIAL_VISIBLE} restantes)
            </Button>
          </div>
        )}

        {/* History link */}
        <div className="text-center">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/pronto-atendimento/historico")}>
            📋 Consultar meu histórico (CPF)
          </Button>
        </div>

        {/* Legal Footer */}
        <div className="text-center space-y-2 pt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            A renovação de receitas está sujeita à avaliação do profissional de saúde. Medicamentos da lista C1/C2/C3 e tarja preta (ANVISA Portaria 344/98 e RDC 471/2021) não são atendidos por este serviço.
          </p>
          <p className="text-[10px] text-muted-foreground/60">Powered by SALBCARE</p>
        </div>
      </div>

      {/* Triage Dialog */}
      <Dialog open={triageOpen} onOpenChange={setTriageOpen}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> Triagem Inteligente
            </DialogTitle>
            <DialogDescription className="text-xs">
              Responda algumas perguntas para encontrar o profissional ideal.
            </DialogDescription>
          </DialogHeader>
          <TriageChat
            onSpecialtyRecommended={(key) => {
              setSpecialtyFilter(key);
              setTriageOpen(false);
            }}
            onClose={() => setTriageOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProntoAtendimento;
