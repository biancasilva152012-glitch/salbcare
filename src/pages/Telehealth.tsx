import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Phone, PhoneOff, Mic, MicOff, Monitor, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";

interface Teleconsultation {
  id: number;
  patient: string;
  date: string;
  time: string;
  duration: string;
  notes: string;
  status: "upcoming" | "completed";
}

const teleconsultations: Teleconsultation[] = [
  { id: 1, patient: "João Oliveira", date: "2026-03-12", time: "10:30", duration: "30 min", notes: "Primeira consulta", status: "upcoming" },
  { id: 2, patient: "Pedro Lima", date: "2026-03-13", time: "09:00", duration: "45 min", notes: "Acompanhamento", status: "upcoming" },
  { id: 3, patient: "Maria Santos", date: "2026-03-10", time: "14:00", duration: "25 min", notes: "Retorno - paciente estável", status: "completed" },
  { id: 4, patient: "Ana Costa", date: "2026-03-08", time: "11:00", duration: "40 min", notes: "Ajuste de medicação", status: "completed" },
];

const Telehealth = () => {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");

  if (inCall) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center relative">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-accent text-4xl font-bold text-primary">JO</div>
          <p className="absolute bottom-8 text-sm text-muted-foreground">João Oliveira • Teleconsulta em andamento</p>
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

  const filtered = teleconsultations.filter((t) => t.status === tab);

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
          {filtered.map((tc) => (
            <div key={tc.id} className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                    {tc.patient.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tc.patient}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(tc.date + "T12:00:00").toLocaleDateString("pt-BR")} às {tc.time} • {tc.duration}
                    </div>
                  </div>
                </div>
              </div>
              {tc.notes && <p className="text-xs text-muted-foreground pl-13">{tc.notes}</p>}
              {tc.status === "upcoming" && (
                <Button onClick={() => setInCall(true)} size="sm" className="w-full gradient-primary gap-1 mt-1">
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
