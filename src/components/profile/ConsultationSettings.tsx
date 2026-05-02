import { useState, useEffect } from "react";
import { Save, Loader2, Video, CheckCircle, HelpCircle, ExternalLink, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const MeetHelpModal = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button type="button" className="text-muted-foreground hover:text-primary transition-colors">
        <HelpCircle className="h-4 w-4" />
      </button>
    </DialogTrigger>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-base">Como criar seu link fixo do Google Meet</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-3">
          {[
            { step: "1", text: "Acesse meet.google.com no seu navegador" },
            { step: "2", text: "Clique em \"Novo Encontro\" (botão azul)" },
            { step: "3", text: "Escolha \"Criar um link para uso posterior\"" },
            { step: "4", text: "Cole o link gerado aqui na SALBCARE e salve" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {item.step}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Importante</p>
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
            Ative a <strong>Sala de Espera</strong> no Google Meet para que nenhum paciente entre antes de você admiti-lo.
          </p>
        </div>
        <a
          href="https://support.google.com/meet/answer/10364location"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Como ativar a Sala de Espera →
        </a>
      </div>
    </DialogContent>
  </Dialog>
);

const ConsultationSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [meetLink, setMeetLink] = useState("");
  const [meetSaved, setMeetSaved] = useState(false);
  const [availabilityOnline, setAvailabilityOnline] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-settings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("meet_link, availability_online")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setMeetLink(profile.meet_link || "");
      setMeetSaved(!!profile.meet_link);
      setAvailabilityOnline((profile as any).availability_online || false);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          meet_link: meetLink.trim() || null,
          availability_online: availabilityOnline,
        } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setMeetSaved(!!meetLink.trim());
      toast.success("Configurações salvas!");
    },
    onError: () => toast.error("Erro ao salvar. Tente novamente."),
  });

  if (isLoading) return null;

  return (
    <div className="space-y-5">
      {/* Teleconsulta - Meet Link Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Video className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Link de teleconsulta (Google Meet)</h2>
          <MeetHelpModal />
        </div>
        <div className="glass-card p-3 space-y-3">
          <Input
            placeholder="https://meet.google.com/seu-link"
            value={meetLink}
            onChange={(e) => { setMeetLink(e.target.value); setMeetSaved(false); }}
            className="bg-accent border-border"
          />
          {meetSaved && meetLink.trim() && (
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Link salvo com sucesso.</span>
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full gradient-primary font-semibold gap-2"
      >
        {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saveMutation.isPending ? "Salvando..." : "Salvar configurações"}
      </Button>
    </div>
  );
};

export default ConsultationSettings;
