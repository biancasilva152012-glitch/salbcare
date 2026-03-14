import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  content: string;
  sender: "user" | "contador";
  created_at: string;
}

const AccountantChatTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      <div className="glass-card p-3 mb-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Precisa de ajuda com contabilidade? Nosso contador pode te ajudar com declaração de imposto de renda, emissão de notas fiscais, abertura de CNPJ, enquadramento tributário e muito mais. Todas as notas fiscais são emitidas exclusivamente pelo contador, garantindo total conformidade com a legislação vigente.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Inicie uma conversa com seu contador. Ele responderá o mais breve possível.
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
    </div>
  );
};

export default AccountantChatTab;
