import { useState } from "react";
import { Star, MessageSquare, FileText, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const AccountantPartnerCard = () => {
  const { user } = useAuth();
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestText, setRequestText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: partnerInfo, isLoading } = useQuery({
    queryKey: ["partner-accountant-card", user?.id],
    queryFn: async () => {
      const { data: hire } = await supabase
        .from("partner_hires")
        .select("partner_id")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      if (!hire) return null;
      const { data: partner } = await supabase
        .from("accounting_partners")
        .select("*")
        .eq("id", hire.partner_id)
        .single();
      return partner;
    },
    enabled: !!user,
  });

  const handleSendRequest = async () => {
    if (!requestText.trim()) return;
    setSending(true);
    try {
      // Send as a chat message flagged as a service request
      await (supabase as any).from("chat_messages").insert({
        user_id: user!.id,
        content: `[SOLICITAÇÃO DE ORÇAMENTO]\n\n${requestText}`,
        sender: "user",
      });
      toast.success("Solicitação enviada! Seu contador receberá a mensagem.");
      setRequestText("");
      setRequestOpen(false);
    } catch {
      toast.error("Erro ao enviar solicitação.");
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!partnerInfo) {
    return (
      <div className="glass-card p-5 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Nenhum contador parceiro vinculado à sua conta ainda.
        </p>
        <p className="text-xs text-muted-foreground">
          Acesse a aba <span className="font-medium text-foreground">Parceiros</span> para contratar um contador.
        </p>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
      />
    ));
  };

  return (
    <>
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {partnerInfo.company_name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{partnerInfo.company_name}</p>
            <p className="text-xs text-muted-foreground">
              {partnerInfo.specialty || "Contabilidade para profissionais de saúde"}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            {renderStars(partnerInfo.rating)}
            <span className="text-xs text-muted-foreground ml-1">
              ({partnerInfo.reviews_count} avaliações)
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 gradient-primary gap-1" asChild>
            <a href="/accounting?tab=chat">
              <MessageSquare className="h-3.5 w-3.5" /> Falar com meu contador
            </a>
          </Button>
        </div>

        <button
          onClick={() => setRequestOpen(true)}
          className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
        >
          Preciso de serviços além do plano → solicitar orçamento
        </button>
      </div>

      {/* Extra services request dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />
              Solicitar orçamento
            </DialogTitle>
            <DialogDescription className="text-sm">
              Descreva o serviço que você precisa. Seu contador parceiro receberá a solicitação e responderá com um orçamento diretamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Descreva o que você precisa</Label>
              <Textarea
                placeholder="Ex: Preciso de escrituração contábil completa para minha clínica, incluindo folha de pagamento para 3 funcionários..."
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                rows={4}
                className="bg-accent border-border text-sm resize-none"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Os honorários serão combinados diretamente entre você e o contador, fora da plataforma.
            </p>
            <Button
              onClick={handleSendRequest}
              disabled={!requestText.trim() || sending}
              className="w-full gradient-primary"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccountantPartnerCard;
