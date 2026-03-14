import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Mic, Clock, Loader2, WifiOff, RefreshCw, Volume2, MessageSquare } from "lucide-react";

const PatientRoom = () => {
  const [searchParams] = useSearchParams();
  const tcId = searchParams.get("id");
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!tcId) {
      setError("Link inválido");
      setLoading(false);
      return;
    }
    fetchRoom();
  }, [tcId]);

  const fetchRoom = async () => {
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("daily-room", {
        body: { action: "get-room", teleconsultation_id: tcId },
      });
      if (fnErr) throw fnErr;
      setRoomInfo(data);
    } catch {
      setError("Não foi possível carregar a sala");
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!roomInfo?.date) return;
    const interval = setInterval(() => {
      const diff = new Date(roomInfo.date).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h > 0 ? `${h}h ` : ""}${m}min ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [roomInfo?.date]);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissionsGranted(true);
    } catch {
      // Show instruction
    }
  };

  const enterCall = () => setInCall(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando sala...</p>
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

  // In call - lazy load VideoRoom
  if (inCall && roomInfo?.room_url) {
    const VideoRoom = require("@/components/telehealth/VideoRoom").default;
    return (
      <VideoRoom
        roomUrl={roomInfo.room_url}
        patientName={roomInfo.patient_name}
        isDoctor={false}
        onEnd={() => {
          setInCall(false);
        }}
      />
    );
  }

  const isBeforeTime = countdown !== "";
  const professionalTypeLabel: Record<string, string> = {
    medico: "Dr(a).", dentista: "Dr(a).", psicologo: "Psic.", fisioterapeuta: "Fisio.", nutricionista: "Nutri.",
  };
  const prefix = professionalTypeLabel[roomInfo?.professional_type || "medico"] || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">S</div>
          <span className="text-lg font-bold">SALBCARE</span>
        </div>

        {isBeforeTime ? (
          <>
            <div className="space-y-2">
              <p className="text-lg font-semibold">Você está na sala de espera</p>
              <p className="text-sm text-muted-foreground">
                {prefix} {roomInfo?.doctor_name} entrará em instantes.
              </p>
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
            <p className="text-sm text-muted-foreground">
              {prefix} {roomInfo?.doctor_name} está aguardando você.
            </p>
          </div>
        )}

        {!permissionsGranted ? (
          <div className="space-y-4">
            <div className="glass-card p-4 space-y-3">
              <p className="text-sm font-medium">Precisamos de acesso à câmera e microfone</p>
              <p className="text-xs text-muted-foreground">
                Clique no botão abaixo e depois em "Permitir" na janela que abrir no seu navegador.
              </p>
              <div className="flex items-center justify-center gap-6 py-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Câmera</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Microfone</span>
                </div>
              </div>
            </div>
            <Button onClick={requestPermissions} className="w-full gradient-primary font-semibold">
              Liberar câmera e microfone
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-4 text-xs text-green-600">
              <span className="flex items-center gap-1"><Camera className="h-3.5 w-3.5" /> Câmera ✓</span>
              <span className="flex items-center gap-1"><Mic className="h-3.5 w-3.5" /> Microfone ✓</span>
            </div>
            <Button
              onClick={enterCall}
              disabled={!roomInfo?.room_url}
              className="w-full gradient-primary font-semibold text-base py-6"
            >
              Entrar na consulta
            </Button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          Não é necessário instalar nada. A consulta acontece diretamente no navegador.
        </p>
      </div>
    </div>
  );
};

export default PatientRoom;
