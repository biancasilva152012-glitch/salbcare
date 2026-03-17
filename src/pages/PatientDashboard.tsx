import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Clock, Star, User, LogOut, History, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PageSkeleton from "@/components/PageSkeleton";

const SPECIALTIES = [
  { key: "medico", emoji: "🩺", label: "Médico" },
  { key: "psicologo", emoji: "🧠", label: "Psicólogo" },
  { key: "nutricionista", emoji: "🥗", label: "Nutricionista" },
  { key: "dentista", emoji: "🦷", label: "Dentista" },
  { key: "fisioterapeuta", emoji: "💪", label: "Fisioterapeuta" },
];

const DAY_MAP: Record<number, string> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };

function getNextAvailableSlot(availableHours: any, slotDuration: number = 30, intervalMin: number = 10, minAdvanceHours: number = 3): string | null {
  if (!availableHours || typeof availableHours !== "object") return null;
  const now = new Date();
  const minTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);

  for (let offset = 0; offset < 14; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const dayKey = DAY_MAP[d.getDay()];
    const ranges = availableHours[dayKey];
    if (!Array.isArray(ranges) || ranges.length === 0) continue;

    for (const range of ranges) {
      const [startH, startM] = range.start.split(":").map(Number);
      const [endH, endM] = range.end.split(":").map(Number);
      let cursor = startH * 60 + startM;
      const end = endH * 60 + endM;
      const step = slotDuration + intervalMin;

      while (cursor + slotDuration <= end) {
        const h = Math.floor(cursor / 60);
        const m = cursor % 60;
        const slotDate = new Date(d);
        slotDate.setHours(h, m, 0, 0);

        if (slotDate > minTime) {
          const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          if (offset === 0) return `Hoje às ${timeStr}`;
          if (offset === 1) return `Amanhã às ${timeStr}`;
          const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
          return `${dayNames[d.getDay()]} às ${timeStr}`;
        }
        cursor += step;
      }
    }
  }
  return null;
}

const PatientDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("search");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["patient-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name, phone, email").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: professionals = [], isLoading: profsLoading } = useQuery({
    queryKey: ["patient-professionals", selectedSpecialty],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_professionals", {
        specialty_filter: selectedSpecialty || null,
      });
      return data || [];
    },
  });

  // Only fetch appointments when on appointments/history tab
  const { data: myAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["patient-appointments", user?.id, profile?.email],
    queryFn: async () => {
      const email = profile?.email || user?.email;
      if (!email) return [];
      const { data } = await supabase
        .from("appointments")
        .select("id, patient_name, date, time, appointment_type, notes, status")
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(50);
      return (data || []).filter((a: any) => a.notes?.includes(email));
    },
    enabled: !!user && !!(profile?.email || user?.email) && (activeTab === "appointments" || activeTab === "history"),
  });

  // Realtime: listen for appointment changes
  useEffect(() => {
    const channel = supabase
      .channel("patient-appointments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const scheduledAppointments = myAppointments.filter((a: any) => a.status === "scheduled");
  const completedAppointments = myAppointments.filter((a: any) => a.status === "completed" || a.status === "cancelled");

  const filteredProfessionals = professionals.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <PageSkeleton variant="list" />
      </div>
    );
  }

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
            <Button variant="ghost" size="icon" onClick={() => setActiveTab("profile")}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="text-xs gap-1"><Search className="h-3.5 w-3.5" /> Buscar</TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs gap-1"><Calendar className="h-3.5 w-3.5" /> Agendadas</TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1"><History className="h-3.5 w-3.5" /> Histórico</TabsTrigger>
          </TabsList>

          {/* TAB: Search Professionals */}
          <TabsContent value="search" className="space-y-4 mt-4">
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

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar profissional..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-accent border-border pl-9"
              />
            </div>

            {profsLoading ? (
              <PageSkeleton variant="list" />
            ) : (
              <div className="space-y-3">
                {filteredProfessionals.length === 0 && (
                  <div className="text-center py-8 space-y-2">
                    <Search className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Nenhum profissional disponível no momento.</p>
                  </div>
                )}

                {filteredProfessionals.map((prof: any) => {
                  const nextSlot = getNextAvailableSlot(
                    prof.available_hours,
                    prof.slot_duration || 30,
                    prof.interval_minutes || 10,
                    prof.min_advance_hours || 3
                  );
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
                          {nextSlot ? (
                            <p className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {nextSlot}
                            </p>
                          ) : (
                            <p className="text-[11px] text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Sem horários disponíveis
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
            )}
          </TabsContent>

          {/* TAB: My Appointments */}
          <TabsContent value="appointments" className="space-y-4 mt-4">
            {appointmentsLoading ? (
              <PageSkeleton variant="list" />
            ) : scheduledAppointments.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Nenhuma consulta agendada.</p>
                <p className="text-xs text-muted-foreground">Busque um profissional na aba "Buscar" para agendar sua primeira consulta.</p>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("search")} className="mt-2">
                  Buscar profissional
                </Button>
              </div>
            ) : (
              scheduledAppointments.map((apt: any) => (
                <div key={apt.id} className="glass-card p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{apt.patient_name}</p>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Agendada</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(apt.date), "dd/MM/yyyy", { locale: ptBR })} às {apt.time?.substring(0, 5)}
                  </p>
                  {apt.appointment_type === "telehealth" && (
                    <span className="text-[10px] text-blue-500 flex items-center gap-1">🎥 Teleconsulta</span>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* TAB: History */}
          <TabsContent value="history" className="space-y-4 mt-4">
            {appointmentsLoading ? (
              <PageSkeleton variant="list" />
            ) : completedAppointments.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <History className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Seu histórico de consultas aparecerá aqui após suas primeiras consultas.</p>
              </div>
            ) : (
              completedAppointments.map((apt: any) => (
                <div key={apt.id} className="glass-card p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{apt.patient_name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      apt.status === "completed" ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"
                    }`}>
                      {apt.status === "completed" ? "Concluída" : "Cancelada"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(apt.date), "dd/MM/yyyy", { locale: ptBR })} às {apt.time?.substring(0, 5)}
                  </p>
                </div>
              ))
            )}
          </TabsContent>

          {/* TAB: Profile (hidden from tabs, accessible via bottom nav) */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="text-center space-y-3">
              <div className="gradient-primary mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <User className="h-7 w-7 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-bold">{profile?.name || "Paciente"}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
              {profile?.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
            </div>

            <div className="space-y-2">
              <div className="glass-card p-3 text-sm">
                <span className="text-muted-foreground">E-mail:</span> {profile?.email || user?.email}
              </div>
              <div className="glass-card p-3 text-sm">
                <span className="text-muted-foreground">Telefone:</span> {profile?.phone || "Não informado"}
              </div>
            </div>

            <Button onClick={handleLogout} variant="outline" className="w-full border-border text-destructive gap-2">
              <LogOut className="h-4 w-4" /> Sair da conta
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-xl z-50">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          <button onClick={() => setActiveTab("search")} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 px-3 text-xs ${activeTab === "search" ? "text-primary" : "text-muted-foreground"}`}>
            <Search className="h-5 w-5" />
            <span className="font-medium">Buscar</span>
          </button>
          <button onClick={() => setActiveTab("appointments")} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 px-3 text-xs ${activeTab === "appointments" ? "text-primary" : "text-muted-foreground"}`}>
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Consultas</span>
          </button>
          <button onClick={() => setActiveTab("profile")} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 px-3 text-xs ${activeTab === "profile" ? "text-primary" : "text-muted-foreground"}`}>
            <User className="h-5 w-5" />
            <span className="font-medium">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
