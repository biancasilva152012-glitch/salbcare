import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Camera, CameraOff, MessageSquare, ClipboardList, PhoneOff, Wifi, WifiOff, Phone, RefreshCw, Volume2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface VideoRoomProps {
  roomUrl: string;
  patientName: string;
  patientPhone?: string | null;
  isDoctor: boolean;
  onEnd: (notes: string, mode: "video" | "audio" | "chat") => void;
  children?: React.ReactNode; // Clinical panel slot
}

const VideoRoom = ({ roomUrl, patientName, patientPhone, isDoctor, onEnd, children }: VideoRoomProps) => {
  const [daily, setDaily] = useState<any>(null);
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [notes, setNotes] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fallback, setFallback] = useState(false);
  const [mode, setMode] = useState<"video" | "audio" | "chat">("video");
  const [networkQuality, setNetworkQuality] = useState<"good" | "poor" | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const joinRoom = useCallback(async () => {
    setLoading(true);
    setFallback(false);

    loadTimeoutRef.current = setTimeout(() => {
      if (!joined) setFallback(true);
    }, 15000);

    try {
      const DailyModule = await import("@daily-co/daily-js");
      const DailyIframe = DailyModule.default;

      const callObject = DailyIframe.createCallObject({
        url: roomUrl,
        dailyConfig: {
          experimentalChromeVideoMuteLightOff: true,
        },
      });

      callObject.on("joined-meeting", () => {
        setJoined(true);
        setLoading(false);
        setFallback(false);
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        startTimer();
      });

      callObject.on("track-started", (evt: any) => {
        if (evt.participant?.local) {
          if (evt.track.kind === "video" && localVideoRef.current) {
            localVideoRef.current.srcObject = new MediaStream([evt.track]);
          }
        } else {
          if (evt.track.kind === "video" && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = new MediaStream([evt.track]);
          } else if (evt.track.kind === "audio") {
            const audio = new Audio();
            audio.srcObject = new MediaStream([evt.track]);
            audio.play();
          }
        }
      });

      callObject.on("network-quality-change", (evt: any) => {
        const quality = evt?.threshold;
        if (quality === "very-low" || quality === "low") {
          setNetworkQuality("poor");
        } else {
          setNetworkQuality("good");
        }
      });

      callObject.on("app-message", (evt: any) => {
        if (evt.data?.type === "chat") {
          setChatMessages((prev) => [...prev, { sender: evt.data.sender, text: evt.data.text }]);
        }
      });

      callObject.on("error", () => {
        setFallback(true);
        setLoading(false);
      });

      await callObject.join({ url: roomUrl, startVideoOff: false, startAudioOff: false });
      setDaily(callObject);

      // Adaptive quality: start at 480p
      callObject.setBandwidth({ trackConstraints: { width: 640, height: 480 } });
    } catch (err) {
      console.error("Daily join error:", err);
      setFallback(true);
      setLoading(false);
    }
  }, [roomUrl]);

  useEffect(() => {
    joinRoom();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, []);

  const toggleMic = () => {
    if (daily) {
      daily.setLocalAudio(!micOn);
      setMicOn(!micOn);
    }
  };

  const toggleCam = () => {
    if (daily) {
      daily.setLocalVideo(!camOn);
      setCamOn(!camOn);
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    if (daily) {
      daily.sendAppMessage({ type: "chat", sender: isDoctor ? "Profissional" : "Paciente", text: chatInput.trim() });
      setChatMessages((prev) => [...prev, { sender: isDoctor ? "Você" : "Você", text: chatInput.trim() }]);
      setChatInput("");
    }
  };

  const handleEnd = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (daily) {
      await daily.leave();
      daily.destroy();
    }
    onEnd(notes, mode);
  };

  const switchToAudio = () => {
    if (daily) daily.setLocalVideo(false);
    setCamOn(false);
    setMode("audio");
    setFallback(false);
    toast.info("Continuando apenas por áudio");
  };

  const switchToChat = () => {
    if (daily) {
      daily.setLocalVideo(false);
      daily.setLocalAudio(false);
    }
    setCamOn(false);
    setMicOn(false);
    setMode("chat");
    setShowChat(true);
    setFallback(false);
    toast.info("Continuando por chat de texto");
  };

  const retry = () => {
    if (daily) {
      daily.leave();
      daily.destroy();
    }
    setDaily(null);
    setJoined(false);
    joinRoom();
  };

  // Fallback overlay
  if (fallback) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6">
        <div className="max-w-sm w-full space-y-4 text-center">
          <WifiOff className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold">O vídeo está demorando para carregar</h2>
          <p className="text-sm text-muted-foreground">O que você quer fazer?</p>
          <div className="space-y-2">
            <Button onClick={retry} variant="outline" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </Button>
            <Button onClick={switchToAudio} variant="outline" className="w-full gap-2">
              <Volume2 className="h-4 w-4" /> Continuar só por áudio
            </Button>
            <Button onClick={switchToChat} variant="outline" className="w-full gap-2">
              <MessageSquare className="h-4 w-4" /> Continuar por chat de texto
            </Button>
            {isDoctor && patientPhone && (
              <Button variant="outline" className="w-full gap-2" asChild>
                <a href={`tel:${patientPhone}`}>
                  <Phone className="h-4 w-4" /> Ligar para o paciente
                </a>
              </Button>
            )}
            <Button onClick={handleEnd} variant="destructive" className="w-full gap-2">
              <PhoneOff className="h-4 w-4" /> Encerrar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Network warning */}
      {networkQuality === "poor" && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
            <Wifi className="h-4 w-4" /> Conexão instável detectada
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={switchToAudio}>
              Só áudio
            </Button>
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={switchToChat}>
              Chat
            </Button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/95 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {patientName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold">{patientName}</p>
            <p className="text-[11px] text-muted-foreground">
              {mode === "chat" ? "Chat de texto" : mode === "audio" ? "Apenas áudio" : "Teleconsulta"} • {formatTime(elapsed)}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative bg-muted flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Conectando...</p>
            </div>
          )}

          {mode === "chat" ? (
            <div className="w-full h-full flex flex-col p-4">
              <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === "Você" ? "justify-end" : "justify-start"}`}>
                    <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${m.sender === "Você" ? "bg-primary text-primary-foreground" : "bg-accent"}`}>
                      <p className="text-[10px] font-medium opacity-70 mb-0.5">{m.sender}</p>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  placeholder="Digite sua mensagem..."
                  className="resize-none bg-accent border-border"
                  rows={1}
                />
                <Button onClick={sendChat} size="sm" className="gradient-primary shrink-0">
                  Enviar
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Remote video (big) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ display: joined && !loading ? "block" : "none" }}
              />
              {/* Local video (PiP) */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-20 right-4 w-28 h-20 sm:w-36 sm:h-28 rounded-lg object-cover border-2 border-background shadow-lg"
                style={{ display: joined && camOn ? "block" : "none" }}
              />
            </>
          )}
        </div>

        {/* Sidebar */}
        {showSidebar && isDoctor && (
          <div className="w-80 border-l border-border overflow-y-auto bg-background shrink-0">
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">Anotações em tempo real</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações da consulta..."
                className="bg-accent border-border resize-none min-h-[200px]"
              />
              {children}
            </div>
          </div>
        )}

        {/* Chat panel */}
        {showChat && mode !== "chat" && (
          <div className="w-72 border-l border-border flex flex-col bg-background shrink-0">
            <div className="p-3 border-b border-border">
              <h3 className="text-sm font-semibold">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === "Você" ? "justify-end" : "justify-start"}`}>
                  <div className={`rounded-lg px-3 py-1.5 max-w-[85%] text-xs ${m.sender === "Você" ? "bg-primary text-primary-foreground" : "bg-accent"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder="Mensagem..."
                className="resize-none bg-accent border-border text-xs"
                rows={1}
              />
              <Button onClick={sendChat} size="sm" className="gradient-primary shrink-0 text-xs h-8">
                ↑
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-border bg-background/95 backdrop-blur shrink-0">
        <button onClick={toggleMic} className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${micOn ? "bg-accent hover:bg-accent/80" : "bg-destructive text-destructive-foreground"}`}>
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button onClick={toggleCam} className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${camOn ? "bg-accent hover:bg-accent/80" : "bg-destructive text-destructive-foreground"}`}>
          {camOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
        </button>
        <button onClick={() => setShowChat(!showChat)} className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${showChat ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}>
          <MessageSquare className="h-5 w-5" />
        </button>
        {isDoctor && (
          <button onClick={() => setShowSidebar(!showSidebar)} className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${showSidebar ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}>
            <ClipboardList className="h-5 w-5" />
          </button>
        )}
        <button onClick={handleEnd} className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default VideoRoom;
