import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Clock, Star, User, LogOut, History, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { SPECIALTY_SEO } from "@/config/specialtyLegalNotices";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SPECIALTIES = [
  { key: "medico", emoji: "🩺", label: "Médico" },
  { key: "psicologo", emoji: "🧠", label: "Psicólogo" },
  { key: "nutricionista", emoji: "🥗", label: "Nutricionista" },
  { key: "dentista", emoji: "🦷", label: "Dentista" },
  { key: "fisioterapeuta", emoji: "💪", label: "Fisioterapeuta" },
];

const DAY_MAP: Record<number, string> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };

function getNextAvailableSlot(availableHours: any): string | null {
  if (!availableHours || typeof availableHours !== "object") return null;
  const now = new Date();
  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const dayKey = DAY_MAP[d.getDay()];
    const slots = availableHours[dayKey];
    if (!Array.isArray(slots) || slots.length === 0) continue;
    const earliest = slots[0]?.start;
    if (!earliest) continue;
    if (offset === 0) return `Hoje às ${earliest}`;
    if (offset === 1) return `Amanhã às ${earliest}`;
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return `${dayNames[d.getDay()]} às ${earliest}`;
  }
  return null;
}

const PatientDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["patient-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name, phone, email").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["patient-professionals", selectedSpecialty],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_professionals", {
        specialty_filter: selectedSpecialty || null,
      });
      return data || [];
    },
  });

  const { data: myAppointments = [] } = useQuery({
    queryKey: ["patient-appointments", user?.id],
    queryFn: async () => {
      // Appointments where the patient's email matches
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("status", "scheduled")
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      return (data || []).filter((a: any) =>
        a.notes?.includes(profile?.email || user?.email || "___NOMATCH___")
      );
    },
    enabled: !!user,
  });

  const filteredProfessionals = professionals.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-xl px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Olá,</p>
            <h1 className="text-base font-bold">{profile?.name || "Paciente"} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/patient-profile")}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="text-xs gap-1"><Search className="h-3.5 w-3.5" /> Buscar</TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs gap-1"><Calendar className="h-3.5 w-3.5" /> Agendadas</TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1"><History className="h-3.5 w-3.5" /> Histórico</TabsTrigger>
          </TabsList>

          {/* TAB: Search Professionals */}
          <TabsContent value="search" className="space-y-4 mt-4">
            {/* Specialty pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedSpecialty(null)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  !selectedSpecialty ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"
                }`}
              >
                Todos
              </button>
              {SPECIALTIES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSelectedSpecialty(s.key)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                    selectedSpecialty === s.key ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"
                  }`}
                >
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar profissional..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-accent border-border pl-9"
              />
            </div>

            {/* Professional cards */}
            <div className="space-y-3">
              {filteredProfessionals.length === 0 && (
                <div className="text-center py-8 space-y-2">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Nenhum profissional disponível no momento.</p>
                </div>
              )}

              {filteredProfessionals.map((prof: any) => {
                const nextSlot = getNextAvailableSlot(prof.available_hours);
                const price = prof.consultation_price ? Number(prof.consultation_price) : 0;
                return (
                  <motion.div
                    key={prof.user_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {prof.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{prof.name}</p>
                          <p className="text-[11px] text-muted-foreground">{prof.crm ? `${prof.crm} • ` : ""}{prof.professional_type}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        {nextSlot && (
                          <p className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {nextSlot}
                          </p>
                        )}
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            ))}
                          </div>
                          {price > 0 && <span className="text-[11px] text-muted-foreground ml-1">R$ {price.toFixed(0)}</span>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={() => navigate(`/booking?doctor=${prof.user_id}&name=${encodeURIComponent(prof.name)}`)}
                      >
                        Agendar
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB: My Appointments */}
          <TabsContent value="appointments" className="space-y-4 mt-4">
            {myAppointments.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Nenhuma consulta agendada.</p>
                <p className="text-xs text-muted-foreground">Busque um profissional para agendar.</p>
              </div>
            ) : (
              myAppointments.map((apt: any) => (
                <div key={apt.id} className="glass-card p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{apt.patient_name}</p>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Agendada</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(apt.date), "dd/MM/yyyy", { locale: ptBR })} às {apt.time?.substring(0, 5)}
                  </p>
                </div>
              ))
            )}
          </TabsContent>

          {/* TAB: History */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <div className="text-center py-8 space-y-2">
              <History className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Seu histórico aparecerá aqui.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-xl z-50">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          <button onClick={() => {}} className="flex flex-col items-center gap-0.5 py-2.5 px-3 text-xs text-primary">
            <Search className="h-5 w-5" />
            <span className="font-medium">Buscar</span>
          </button>
          <button onClick={() => {}} className="flex flex-col items-center gap-0.5 py-2.5 px-3 text-xs text-muted-foreground">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Consultas</span>
          </button>
          <button onClick={() => {}} className="flex flex-col items-center gap-0.5 py-2.5 px-3 text-xs text-muted-foreground">
            <User className="h-5 w-5" />
            <span className="font-medium">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
