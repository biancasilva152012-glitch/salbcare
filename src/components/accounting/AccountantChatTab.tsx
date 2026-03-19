import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Info, ShieldCheck, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  content: string;
  sender: "user" | "contador";
  created_at: string;
}

const WELCOME_MODAL_KEY = "salbcare_chat_welcome_seen";

const AccountantChatTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome modal only once
  useEffect(() => {
    if (user && !localStorage.getItem(`${WELCOME_MODAL_KEY}_${user.id}`)) {
      setShowWelcome(true);
    }
  }, [user]);

  const handleDismissWelcome = () => {
    if (user) {
      localStorage.setItem(`${WELCOME_MODAL_KEY}_${user.id}`, "true");
    }
    setShowWelcome(false);
  };

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("chat_messages")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      return (data || []) as Message[];
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Fetch the partner accountant info
  const { data: partnerInfo } = useQuery({
    queryKey: ["partner-accountant", user?.id],
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("chat_messages").insert({
        user_id: user!.id,
        content: message,
        sender: "user",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate();
  };

  const accountantName = partnerInfo?.company_name || "seu contador parceiro";

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 220px)", minHeight: 300 }}>
      <div className="glass-card p-3 mb-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Precisa de ajuda contábil? Seu contador parceiro pode te ajudar com declaração de imposto de renda, dúvidas contábeis, enquadramento tributário e muito mais. As notas fiscais são emitidas exclusivamente pelo contador, garantindo conformidade legal.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Inicie uma conversa com seu contador parceiro. Ele responderá o mais breve possível.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex items-end gap-2 max-w-[80%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${msg.sender === "user" ? "bg-primary/10" : "bg-accent"}`}>
                {msg.sender === "user" ? <User className="h-3.5 w-3.5 text-primary" /> : <Bot className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className={`rounded-2xl px-3.5 py-2 text-sm ${msg.sender === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-accent rounded-bl-md"}`}>
                {msg.content}
                <p className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Input
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="bg-accent border-border"
        />
        <Button onClick={handleSend} disabled={!message.trim() || sendMutation.isPending} size="icon" className="gradient-primary shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Fixed footer disclaimer */}
      <div className="pt-2 pb-1">
        <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
          A assessoria contábil é prestada por contador parceiro independente com CRC ativo. A SALBCARE é a plataforma de conexão — não é um escritório de contabilidade.
        </p>
      </div>

      {/* Welcome modal - shown only once */}
      <Dialog open={showWelcome} onOpenChange={(open) => { if (!open) handleDismissWelcome(); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Como funciona sua assessoria contábil
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm leading-relaxed pt-2 space-y-3">
                <p>
                  Você será atendido por <span className="font-medium text-foreground">{accountantName}</span>, contador parceiro da SALBCARE com CRC ativo.
                </p>

                <div>
                  <p className="font-medium text-foreground mb-1">O que ele pode te ajudar:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li className="flex items-start gap-1.5">
                      <span className="text-success mt-0.5">✓</span>
                      Tirar dúvidas sobre Carnê-Leão, MEI, Simples Nacional e IRPF
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-success mt-0.5">✓</span>
                      Orientar sobre abertura ou migração de empresa
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-success mt-0.5">✓</span>
                      Revisar sua situação tributária e sugerir o melhor regime
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-success mt-0.5">✓</span>
                      Emitir relatórios e pareceres dentro do seu plano
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-foreground mb-1">O que está fora do escopo deste plano:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li className="flex items-start gap-1.5">
                      <span className="text-destructive mt-0.5">✕</span>
                      Execução de serviços contábeis completos (escrituração, balanço, folha)
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-destructive mt-0.5">✕</span>
                      Representação junto à Receita Federal
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-destructive mt-0.5">✕</span>
                      Serviços que exijam procuração ou contrato direto com o contador
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-muted-foreground border-t border-border pt-2">
                  Para serviços além do escopo, seu contador parceiro pode te atender diretamente mediante contrato e honorários à parte.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleDismissWelcome} className="w-full gradient-primary mt-2">
            Entendi, iniciar atendimento
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountantChatTab;
