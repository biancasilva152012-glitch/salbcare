import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, WifiOff, RefreshCw, ExternalLink, Video } from "lucide-react";

const PatientRoom = () => {
  const [searchParams] = useSearchParams();
  const tcId = searchParams.get("id");
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!tcId) { setError("Link inválido"); setLoading(false); return; }
    fetchRoom();
  }, [tcId]);

  const fetchRoom = async () => {
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("get-teleconsultation", {
        body: { teleconsultation_id: tcId },
      });
      if (fnErr) throw fnErr;
      setRoomInfo(data);
    } catch {
      setError("Não foi possível carregar os dados da consulta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roomInfo?.date) return;
    const interval = setInterval(() => {
      const diff = new Date(roomInfo.date).getTime() - Date.now();
      if (diff <= 0) { setCountdown(""); clearInterval(interval); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h > 0 ? `${h}h ` : ""}${m}min ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [roomInfo?.date]);

  const handleJoin = () => {
    if (!roomInfo?.room_url) return;
    window.open(roomInfo.room_url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando consulta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-3">
          <WifiOff className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => { setLoading(true); setError(""); fetchRoom(); }} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const isBeforeTime = countdown !== "";
  const prefixMap: Record<string, string> = {
    medico: "Dr(a).", dentista: "Dr(a).", psicologo: "Psic.", fisioterapeuta: "Fisio.", nutricionista: "Nutri.",
  };
  const prefix = prefixMap[roomInfo?.professional_type || "medico"] || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">S</div>
          <span className="text-lg font-bold">SALBCARE</span>
        </div>

        {isBeforeTime ? (
          <>
            <div className="space-y-2">
              <p className="text-lg font-semibold">Sua consulta está agendada</p>
              <p className="text-sm text-muted-foreground">{prefix} {roomInfo?.doctor_name} estará disponível em breve.</p>
            </div>
            <div className="glass-card p-4 space-y-2">
              <Clock className="h-6 w-6 mx-auto text-primary" />
              <p className="text-2xl font-bold text-primary">{countdown}</p>
              <p className="text-xs text-muted-foreground">até o início da consulta</p>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-semibold">Sua consulta está pronta</p>
            <p className="text-sm text-muted-foreground">{prefix} {roomInfo?.doctor_name} está aguardando você.</p>
          </div>
        )}

        {roomInfo?.room_url ? (
          <Button onClick={handleJoin} className="w-full gradient-primary font-semibold text-base py-6 gap-2">
            <ExternalLink className="h-5 w-5" />
            Entrar no Google Meet
          </Button>
        ) : (
          <div className="glass-card p-4 space-y-2">
            <Video className="h-6 w-6 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">O link da consulta ainda não foi disponibilizado pelo profissional.</p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">A consulta acontecerá via Google Meet. Nenhuma instalação necessária.</p>
      </div>
    </div>
  );
};

export default PatientRoom;
