import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Calculator, FileText, ArrowLeft, Send, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentoria-chat`;

const suggestedQuestions = [
  "Estou guardando o suficiente?",
  "Quanto cobrar por consulta?",
  "Como declarar meus recebimentos?",
  "O que é o Carnê-Leão?",
  "Preciso abrir MEI?",
];

const DashboardMentoria = () => {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Calculator states
  const [receitaMedia, setReceitaMedia] = useState("");
  const reservaIdeal = receitaMedia ? parseFloat(receitaMedia) * 6 : null;
  const [custos, setCustos] = useState("");
  const [rendaDesejada, setRendaDesejada] = useState("");
  const [consultas, setConsultas] = useState("");
  const precoMinimo =
    custos && rendaDesejada && consultas && parseFloat(consultas) > 0
      ? (parseFloat(custos) + parseFloat(rendaDesejada)) / parseFloat(consultas)
      : null;
  const [showGuia, setShowGuia] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      const userMsg: Msg = { role: "user", content: text.trim() };
      const allMessages = [...messages, userMsg];
      setMessages(allMessages);
      setInput("");
      setShowSuggestions(false);
      setIsLoading(true);

      let assistantSoFar = "";
      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || "Erro na resposta");
        }

        if (!resp.body) throw new Error("No stream body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Final flush
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {}
          }
        }
      } catch (err) {
        console.error("Mentoria chat error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Não consegui responder agora. Tente novamente em instantes." },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <PageContainer backTo="/dashboard">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {/* Header */}
        <motion.div variants={item}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Mentoria Financeira</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Tire dúvidas sobre suas finanças com base nos seus próprios dados.
          </p>
        </motion.div>

        {/* Chat area */}
        <motion.div variants={item} className="glass-card p-4 flex flex-col" style={{ minHeight: "360px", maxHeight: "60vh" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Pergunte qualquer coisa sobre suas finanças
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border/40 text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/40 rounded-2xl rounded-bl-md px-4 py-3">
                  <motion.div className="flex gap-1.5" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  </motion.div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested questions */}
          {showSuggestions && messages.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 items-end">
            <Textarea
              placeholder="Pergunte sobre suas finanças..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[40px] max-h-[100px] resize-none bg-background/50 border-border/60 text-sm"
              rows={1}
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Separator */}
        <motion.div variants={item}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ferramentas rápidas</p>
        </motion.div>

        {/* Card 1 — Reserva de emergência */}
        <motion.div variants={item} className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold">Reserva de emergência</h2>
          </div>
          <p className="text-xs text-muted-foreground">Quanto você precisa guardar?</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Receita média mensal (R$)</Label>
            <Input type="number" placeholder="Ex: 8000" value={receitaMedia} onChange={(e) => setReceitaMedia(e.target.value)} min="0" />
          </div>
          {reservaIdeal !== null && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">Sua reserva ideal (6 meses)</p>
              <p className="text-2xl font-bold text-primary">
                R$ {reservaIdeal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Card 2 — Preço mínimo por consulta */}
        <motion.div variants={item} className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold">Preço mínimo por consulta</h2>
          </div>
          <p className="text-xs text-muted-foreground">Você está cobrando o valor certo?</p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Custos fixos mensais (R$)</Label>
              <Input type="number" placeholder="Ex: 3000" value={custos} onChange={(e) => setCustos(e.target.value)} min="0" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Renda desejada (R$)</Label>
              <Input type="number" placeholder="Ex: 10000" value={rendaDesejada} onChange={(e) => setRendaDesejada(e.target.value)} min="0" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Consultas por mês</Label>
              <Input type="number" placeholder="Ex: 40" value={consultas} onChange={(e) => setConsultas(e.target.value)} min="1" />
            </div>
          </div>
          {precoMinimo !== null && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">Seu preço mínimo por consulta</p>
              <p className="text-2xl font-bold text-primary">
                R$ {precoMinimo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Card 3 — Carnê-Leão */}
        <motion.div variants={item} className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold">Carnê-Leão</h2>
          </div>
          <p className="text-xs text-muted-foreground">Como declarar seus recebimentos.</p>
          {!showGuia ? (
            <Button variant="outline" size="sm" onClick={() => setShowGuia(true)}>
              Ver guia
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <button onClick={() => setShowGuia(false)} className="text-xs text-primary flex items-center gap-1 mb-2">
                <ArrowLeft className="h-3 w-3" /> Voltar
              </button>
              <p><strong className="text-foreground">O que é o Carnê-Leão?</strong></p>
              <p>É a forma de recolher o Imposto de Renda mensalmente quando você recebe pagamentos de pessoas físicas (seus pacientes).</p>
              <p><strong className="text-foreground">Quem precisa pagar?</strong></p>
              <p>Todo profissional autônomo que recebe mais de R$ 2.112 por mês de pessoas físicas.</p>
              <p><strong className="text-foreground">Como funciona?</strong></p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Acesse o sistema <strong>Carnê-Leão Web</strong> no portal e-CAC da Receita Federal</li>
                <li>Registre todos os seus recebimentos de PF do mês</li>
                <li>Registre as despesas dedutíveis (aluguel do consultório, materiais, etc.)</li>
                <li>O sistema calcula automaticamente o imposto devido</li>
                <li>Gere o DARF e pague até o último dia útil do mês seguinte</li>
              </ol>
              <p><strong className="text-foreground">Despesas que você pode deduzir:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Aluguel do consultório</li>
                <li>Condomínio e IPTU (proporcional ao uso profissional)</li>
                <li>Materiais e equipamentos</li>
                <li>Contribuição ao INSS</li>
                <li>Conselho profissional (CRM, CRP, CRN, etc.)</li>
              </ul>
              <p><strong className="text-foreground">Dica importante:</strong></p>
              <p>Mantenha o controle mensal aqui na SalbCare para facilitar a declaração anual.</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </PageContainer>
  );
};

export default DashboardMentoria;
