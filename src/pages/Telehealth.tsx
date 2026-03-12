import { useState } from "react";
import { motion } from "framer-motion";
import { Video, PhoneOff, Mic, MicOff, Monitor, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Telehealth = () => {
  const { user } = useAuth();
  const [inCall, setInCall] = useState(false);
  const [callPatient, setCallPatient] = useState("");
  const [muted, setMuted] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");

  const { data: teleconsultations = [] } = useQuery({
    queryKey: ["teleconsultations", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("teleconsultations").select("*").eq("user_id", user!.id).order("date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  if (inCall) {
    const initials = callPatient.split(" ").map(n => n[0]).join("");
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center relative">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-accent text-4xl font-bold text-primary">{initials}</div>
          <p className="absolute bottom-8 text-sm text-muted-foreground">{callPatient} • Teleconsulta em andamento</p>
        </div>
        <div className="flex items-center justify-center gap-4 pb-10 pt-4">
          <button onClick={() => setMuted(!muted)} className={`flex h-14 w-14 items-center justify-center rounded-full ${muted ? "bg-destructive" : "bg-accent"}`}>
            {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
          <button className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
            <Monitor className="h-6 w-6" />
          </button>
          <button onClick={() => setInCall(false)} className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive">
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    );
  }

  const now = new Date().toISOString();
  const filtered = teleconsultations.filter((t) =>
    tab === "upcoming" ? t.status === "scheduled" && t.date >= now : t.status === "completed"
  );

  return (
    <PageContainer>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Telehealth</h1>

        <div className="flex gap-2">
          {(["upcoming", "completed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t ? "gradient-primary text-primary-foreground" : "bg-accent text-muted-foreground"
              }`}
            >
              {t === "upcoming" ? "Próximas" : "Histórico"}
            </button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma teleconsulta encontrada</p>}
          {filtered.map((tc) => (
            <div key={tc.id} className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                    {tc.patient_name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tc.patient_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(tc.date).toLocaleDateString("pt-BR")} • {tc.duration ? `${tc.duration} min` : "—"}
                    </div>
                  </div>
                </div>
              </div>
              {tc.notes && <p className="text-xs text-muted-foreground">{tc.notes}</p>}
              {tc.status === "scheduled" && (
                <Button onClick={() => { setCallPatient(tc.patient_name); setInCall(true); }} size="sm" className="w-full gradient-primary gap-1 mt-1">
                  <Video className="h-4 w-4" /> Iniciar Consulta
                </Button>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default Telehealth;
