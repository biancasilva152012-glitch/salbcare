import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Clock, Star, User, LogOut, History, AlertCircle, Phone, Mail, Shield, Download, Trash2, Lock, ChevronRight, FileText, MessageCircle, Pill, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PageSkeleton from "@/components/PageSkeleton";
import { getProfessionalTitle, getCouncilPrefix } from "@/config/professions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import PatientDocumentsTab from "@/components/patients/PatientDocumentsTab";
import PharmacyTab from "@/components/patient/PharmacyTab";
import LabTab from "@/components/patient/LabTab";

const SPECIALTIES = [
  { key: null, emoji: "✨", label: "Todos" },
  { key: "medico", emoji: "🩺", label: "Médico" },
  { key: "psicologo", emoji: "🧠", label: "Psicólogo" },
  { key: "nutricionista", emoji: "🥗", label: "Nutricionista" },
  { key: "dentista", emoji: "🦷", label: "Dentista" },
  { key: "fisioterapeuta", emoji: "💪", label: "Fisioterapeuta" },
];

const DAY_MAP: Record<number, string> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };

function getNextAvailableSlots(availableHours: any, slotDuration: number = 30, intervalMin: number = 10, minAdvanceHours: number = 3, maxSlots: number = 3): string[] {
  if (!availableHours || typeof availableHours !== "object") return [];
  const now = new Date();
  const minTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
  const results: string[] = [];

  for (let offset = 0; offset < 14 && results.length < maxSlots; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const dayKey = DAY_MAP[d.getDay()];
    const ranges = availableHours[dayKey];
    if (!Array.isArray(ranges) || ranges.length === 0) continue;

    for (const range of ranges) {
      if (results.length >= maxSlots) break;
      const [startH, startM] = range.start.split(":").map(Number);
      const [endH, endM] = range.end.split(":").map(Number);
      let cursor = startH * 60 + startM;
      const end = endH * 60 + endM;
      const step = slotDuration + intervalMin;

      while (cursor + slotDuration <= end && results.length < maxSlots) {
        const h = Math.floor(cursor / 60);
        const m = cursor % 60;
        const slotDate = new Date(d);
        slotDate.setHours(h, m, 0, 0);

        if (slotDate > minTime) {
          const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          if (offset === 0) results.push(`Hoje ${timeStr}`);
          else if (offset === 1) results.push(`Amanhã ${timeStr}`);
          else {
            const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
            results.push(`${dayNames[d.getDay()]} ${timeStr}`);
          }
        }
        cursor += step;
      }
    }
  }
  return results;
}

// ─── Tab Components ───────────────────────────────────

const SearchTab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["patient-professionals", selectedSpecialty],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_professionals", {
        specialty_filter: selectedSpecialty || undefined,
      });
      return data || [];
    },
  });

  // Real-time: refresh when any professional profile changes (availability, bio, hours, etc.)
  useEffect(() => {
    const channel = supabase
      .channel("professionals-availability-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["patient-professionals"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["patient-professionals"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const filtered = professionals.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SPECIALTIES.map((s) => (
          <button
            key={s.key ?? "all"}
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

      {isLoading ? (
        <PageSkeleton variant="list" />
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <Search className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Nenhum profissional disponível no momento.</p>
            </div>
          )}

          {filtered.map((prof: any) => {
            const nextSlots = getNextAvailableSlots(
              prof.available_hours,
              prof.slot_duration || 30,
              prof.interval_minutes || 10,
              prof.min_advance_hours || 3,
              3
            );
            const price = prof.consultation_price ? Number(prof.consultation_price) : 0;
            const profTitle = getProfessionalTitle(prof.professional_type);
            const councilPrefix = getCouncilPrefix(prof.professional_type);
            const councilDisplay = prof.council_number
              ? `${councilPrefix} ${prof.council_state ? prof.council_state + "/" : ""}${prof.council_number}`
              : prof.crm || "";
            const initials = prof.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

            return (
              <motion.div
                key={prof.user_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {prof.avatar_url ? (
                      <img
                        src={prof.avatar_url}
                        alt={prof.name}
                        className="h-11 w-11 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{prof.name}</p>
                      <p className="text-[11px] text-muted-foreground">{profTitle}</p>
                      {councilDisplay && (
                        <p className="text-[10px] text-muted-foreground/70">{councilDisplay}</p>
                      )}
                    </div>
                  </div>
                  {price > 0 && (
                    <span className="text-xs font-bold text-primary">R$ {price.toFixed(0)}</span>
                  )}
                </div>
                {/* Bio / summary */}
                {prof.bio && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{prof.bio}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    {nextSlots.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {nextSlots.map((slot, i) => (
                          <span key={i} className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {slot}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Sem horários disponíveis
                      </p>
                    )}
                    <div className="flex items-center gap-1 pt-0.5">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
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
    </div>
  );
};

const AppointmentsTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["patient-profile-email", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("email").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const email = profile?.email || user?.email || "";

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["patient-appointments", user?.id, email],
    queryFn: async () => {
      if (!email) return [];
      const { data } = await supabase
        .from("appointments")
        .select("id, patient_name, date, time, appointment_type, notes, status, user_id")
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(50);
      return (data || []).filter((a: any) => a.notes?.toLowerCase().includes(email.toLowerCase()));
    },
    enabled: !!user && !!email,
  });

  useEffect(() => {
    const channel = supabase
      .channel("patient-appts-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const scheduled = appointments.filter((a: any) => a.status === "scheduled" && new Date(`${a.date}T${a.time}`) >= new Date());
  const history = appointments.filter((a: any) => a.status !== "scheduled" || new Date(`${a.date}T${a.time}`) < new Date());

  const [tab, setTab] = useState<"scheduled" | "history">("scheduled");
  const [cancelId, setCancelId] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!cancelId) return;
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", cancelId);
    queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
    toast.success("Consulta cancelada.");
    setCancelId(null);
  };

  if (isLoading) return <PageSkeleton variant="list" />;

  const list = tab === "scheduled" ? scheduled : history;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("scheduled")}
          className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${tab === "scheduled" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}
        >
          Agendadas ({scheduled.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${tab === "history" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}
        >
          Histórico ({history.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          {tab === "scheduled" ? (
            <>
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Você não tem consultas agendadas.</p>
              <p className="text-xs text-muted-foreground">Que tal marcar uma agora?</p>
              <Button size="sm" variant="outline" onClick={() => navigate("/patient-dashboard")} className="mt-2">
                Buscar profissional
              </Button>
            </>
          ) : (
            <>
              <History className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Você ainda não realizou nenhuma consulta.</p>
              <Button size="sm" variant="outline" onClick={() => navigate("/patient-dashboard")} className="mt-2">
                Agendar minha primeira consulta
              </Button>
            </>
          )}
        </div>
      ) : (
        list.map((apt: any) => {
          const aptDate = new Date(`${apt.date}T${apt.time}`);
          const now = new Date();
          const minutesUntil = (aptDate.getTime() - now.getTime()) / 60000;
          const canEnterMeet = tab === "scheduled" && minutesUntil <= 30 && minutesUntil > -60;

          return (
            <div key={apt.id} className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{apt.patient_name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  apt.status === "scheduled" ? "bg-primary/10 text-primary" :
                  apt.status === "completed" ? "bg-muted text-muted-foreground" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {apt.status === "scheduled" ? "🟢 Confirmada" : apt.status === "completed" ? "⚫ Realizada" : "Cancelada"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                📅 {format(new Date(apt.date), "dd/MM/yyyy", { locale: ptBR })} às {apt.time?.substring(0, 5)}
              </p>
              {apt.appointment_type === "telehealth" && (
                <span className="text-[10px] text-blue-500 flex items-center gap-1">🎥 Teleconsulta</span>
              )}
              {tab === "scheduled" && (
                <div className="flex gap-2 pt-1">
                  {canEnterMeet ? (
                    <Button size="sm" className="text-xs flex-1">Entrar no Google Meet</Button>
                  ) : minutesUntil > 30 ? (
                    <p className="text-[10px] text-muted-foreground">
                      Disponível em {minutesUntil > 60 ? `${Math.floor(minutesUntil / 60)}h` : `${Math.round(minutesUntil)} min`}
                    </p>
                  ) : null}
                  <Button size="sm" variant="outline" className="text-xs text-destructive" onClick={() => setCancelId(apt.id)}>
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          );
        })
      )}

      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar esta consulta?</DialogTitle>
            <DialogDescription>Reembolso disponível com mais de 2h de antecedência.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>Não, manter</Button>
            <Button variant="destructive" onClick={handleCancel}>Sim, cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ProfileTab = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["patient-profile-full", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name, email, phone, created_at").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new1: "", new2: "" });

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ name, phone }).eq("user_id", user!.id);
    queryClient.invalidateQueries({ queryKey: ["patient-profile-full"] });
    toast.success("Dados atualizados!");
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwords.new1 !== passwords.new2) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (passwords.new1.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: passwords.new1 });
    if (error) {
      toast.error("Erro ao alterar senha.");
    } else {
      toast.success("Senha alterada com sucesso!");
      setShowPasswordDialog(false);
      setPasswords({ current: "", new1: "", new2: "" });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (isLoading) return <PageSkeleton variant="list" />;

  return (
    <div className="space-y-5">
      {/* Avatar + Name */}
      <div className="text-center space-y-2">
        <div className="gradient-primary mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <User className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="text-lg font-bold">{profile?.name || "Paciente"}</h2>
        <p className="text-xs text-muted-foreground">{profile?.email}</p>
      </div>

      {/* My Data */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold">Meus dados</h3>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Nome completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-accent border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">E-mail</Label>
            <Input value={profile?.email || ""} disabled className="bg-muted border-border text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3 text-green-500" /> WhatsApp
            </Label>
            <Input
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                let formatted = digits;
                if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                setPhone(formatted);
              }}
              placeholder="(00) 00000-0000"
              className="bg-accent border-border"
            />
            <p className="text-[10px] text-muted-foreground">Opcional — usado para lembretes de consulta</p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>

      {/* Security */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> Segurança</h3>
        <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => setShowPasswordDialog(true)}>
          <Lock className="h-3.5 w-3.5" /> Alterar senha
        </Button>
      </div>

      {/* LGPD */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold">Privacidade e dados (LGPD)</h3>
        <Button size="sm" variant="outline" className="w-full gap-2">
          <Download className="h-3.5 w-3.5" /> Baixar meus dados
        </Button>
        <Button size="sm" variant="outline" className="w-full gap-2 text-destructive border-destructive/30" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="h-3.5 w-3.5" /> Excluir minha conta
        </Button>
      </div>

      {/* Logout */}
      <Button onClick={handleLogout} variant="outline" className="w-full border-destructive/30 text-destructive gap-2">
        <LogOut className="h-4 w-4" /> Sair da conta
      </Button>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nova senha</Label>
              <Input type="password" value={passwords.new1} onChange={(e) => setPasswords({ ...passwords, new1: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Confirmar nova senha</Label>
              <Input type="password" value={passwords.new2} onChange={(e) => setPasswords({ ...passwords, new2: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleChangePassword}>Alterar senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir minha conta</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita. Todos os seus dados serão removidos permanentemente.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { toast.info("Entre em contato com contato@salbcare.com.br para exclusão de conta."); setShowDeleteDialog(false); }}>
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────

const PatientDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["patient-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name, phone, email").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Determine active tab from path
  const getTabFromPath = () => {
    if (location.pathname.includes("/consultas")) return "consultas";
    if (location.pathname.includes("/farmacias")) return "farmacias";
    if (location.pathname.includes("/laboratorios")) return "laboratorios";
    if (location.pathname.includes("/documentos")) return "documentos";
    if (location.pathname.includes("/perfil")) return "perfil";
    return "buscar";
  };

  const activeTab = getTabFromPath();

  const setActiveTab = (tab: string) => {
    if (tab === "buscar") navigate("/patient-dashboard");
    else navigate(`/patient-dashboard/${tab}`);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <PageSkeleton variant="list" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-xl px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Olá,</p>
            <h1 className="text-base font-bold">{profile?.name || "Paciente"} 👋</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 pb-28">
        {activeTab === "buscar" && <SearchTab />}
        {activeTab === "consultas" && <AppointmentsTab />}
        {activeTab === "farmacias" && <PharmacyTab />}
        {activeTab === "laboratorios" && <LabTab />}
        {activeTab === "documentos" && <PatientDocumentsTab />}
        {activeTab === "perfil" && <ProfileTab />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-xl z-50">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          <button onClick={() => setActiveTab("buscar")} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 px-1 text-[10px] transition-colors ${activeTab === "buscar" ? "text-primary" : "text-muted-foreground"}`}>
            <Search className="h-5 w-5" />
            <span className="font-medium">Buscar</span>
          </button>
          <button onClick={() => setActiveTab("consultas")} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 px-1 text-[10px] transition-colors ${activeTab === "consultas" ? "text-primary" : "text-muted-foreground"}`}>
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Consultas</span>
          </button>
          <button onClick={() => setActiveTab("farmacias")} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 px-1 text-[10px] transition-colors ${activeTab === "farmacias" ? "text-primary" : "text-muted-foreground"}`}>
            <Pill className="h-5 w-5" />
            <span className="font-medium">Farmácias</span>
          </button>
          <button onClick={() => setActiveTab("documentos")} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 px-1 text-[10px] transition-colors ${activeTab === "documentos" ? "text-primary" : "text-muted-foreground"}`}>
            <FileText className="h-5 w-5" />
            <span className="font-medium">Docs</span>
          </button>
          <button onClick={() => setActiveTab("perfil")} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 px-1 text-[10px] transition-colors ${activeTab === "perfil" ? "text-primary" : "text-muted-foreground"}`}>
            <User className="h-5 w-5" />
            <span className="font-medium">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
