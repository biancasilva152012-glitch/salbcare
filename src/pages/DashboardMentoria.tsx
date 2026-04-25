import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import UpgradeModal from "@/components/UpgradeModal";
import { Shield, ArrowLeft, Send, MessageCircle, Sparkles, TrendingDown, TrendingUp, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { parseBRL, maskCurrency, formatBRL } from "@/utils/currencyMask";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentoria-chat`;

const EMPTY_STATE_MSG: Msg = {
  role: "assistant",
  content: `Oi! Sou sua mentora financeira 👋

Para te dar respostas personalizadas, preciso que você registre pelo menos um recebimento primeiro.

Vai lá no Financeiro e volta aqui — prometo que vai valer a pena 😊`,
};

/** Highlight R$ values in markdown content */
function highlightFinancialValues(content: string): string {
  return content.replace(
    /R\$\s?[\d.,]+/g,
    (match) => `**${match}**`
  );
}

const CurrencyInput = ({ value, onChange, placeholder, ...props }: { value: string; onChange: (v: string) => void; placeholder?: string; [key: string]: any }) => (
  <Input
    type="text"
    inputMode="numeric"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(maskCurrency(e.target.value))}
    {...props}
  />
);

const DashboardMentoria = () => {
  const { session, user } = useAuth();
  if (!user) {
    return (
      <GuestPaywall
        feature="a Mentora Financeira IA"
        description="A mentora IA precisa de uma conta para personalizar respostas com seus números reais. Cadastro grátis."
        redirectAfterSignup="/dashboard/mentoria"
      />
    );
  }
  const navigate = useNavigate();
  const { canSendMentorship, mentorshipCount, mentorshipLimit, isFree } = useFreemiumLimits();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Calculator states
  const [receitaMedia, setReceitaMedia] = useState("");
  const reservaIdeal = receitaMedia ? parseBRL(receitaMedia) * 6 : null;
  const [custos, setCustos] = useState("");
  const [rendaDesejada, setRendaDesejada] = useState("");
  const [consultas, setConsultas] = useState("");
  const consultasNum = parseInt(consultas, 10);
  const precoMinimo =
    custos && rendaDesejada && consultas && consultasNum > 0
      ? (parseBRL(custos) + parseBRL(rendaDesejada)) / consultasNum
      : null;
  const [showGuia, setShowGuia] = useState(false);

  const [contextDismissed, setContextDismissed] = useState(false);

  // Check financial entries and get rich context data
  const { data: financialContext } = useQuery({
    queryKey: ["financial-context", user?.id],
    queryFn: async () => {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
      const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split("T")[0];
      const twoMonthsAgoEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0).toISOString().split("T")[0];

      const [countRes, thisMonthRes, lastMonthRes, twoMonthsRes, expenseRes, profileRes] = await Promise.all([
        supabase.from("financial_transactions").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("financial_transactions").select("amount, type").eq("user_id", user!.id).eq("type", "income").gte("date", thisMonthStart).lte("date", thisMonthEnd),
        supabase.from("financial_transactions").select("amount, type").eq("user_id", user!.id).eq("type", "income").gte("date", lastMonthStart).lte("date", lastMonthEnd),
        supabase.from("financial_transactions").select("amount, type").eq("user_id", user!.id).eq("type", "income").gte("date", twoMonthsAgoStart).lte("date", twoMonthsAgoEnd),
        supabase.from("financial_transactions").select("amount, category").eq("user_id", user!.id).eq("type", "expense").gte("date", thisMonthStart).lte("date", thisMonthEnd),
        supabase.from("profiles").select("professional_type, name, plan").eq("user_id", user!.id).single(),
      ]);

      const count = countRes.count || 0;
      const thisMonthIncome = (thisMonthRes.data || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
      const thisMonthConsultas = (thisMonthRes.data || []).length;
      const lastMonthIncome = (lastMonthRes.data || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
      const twoMonthsIncome = (twoMonthsRes.data || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
      const thisMonthExpenses = (expenseRes.data || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
      const ticketMedio = thisMonthConsultas > 0 ? thisMonthIncome / thisMonthConsultas : 0;
      const faturamentoCaiu = lastMonthIncome > 0 && thisMonthIncome < lastMonthIncome;
      const faturamentoSubiu = lastMonthIncome > 0 && thisMonthIncome > lastMonthIncome;

      const specialtyMap: Record<string, string> = {
        psicologo: "Psicologia", medico: "Medicina", nutricionista: "Nutrição",
        fisioterapeuta: "Fisioterapia", fonoaudiologo: "Fonoaudiologia",
        terapeuta_ocupacional: "Terapia Ocupacional", educador_fisico: "Educação Física", outro: "Outro",
      };
      const specialty = specialtyMap[(profileRes.data as any)?.professional_type] || "sua área";
      const userName = ((profileRes.data as any)?.name || "").split(" ")[0] || "Profissional";
      const plan = (profileRes.data as any)?.plan || "free";

      return {
        hasEntries: count > 0,
        totalThisMonth: thisMonthIncome,
        totalLastMonth: lastMonthIncome,
        totalTwoMonthsAgo: twoMonthsIncome,
        thisMonthConsultas,
        thisMonthExpenses,
        ticketMedio,
        faturamentoCaiu,
        faturamentoSubiu,
        specialty,
        userName,
        plan,
      };
    },
    enabled: !!user,
  });

  const hasEntries = financialContext?.hasEntries ?? undefined;

  // Dynamic suggestion chips based on user data
  const dynamicSuggestions = useMemo(() => {
    if (!financialContext?.hasEntries) return [];
    const chips: { label: string; icon: any; message: string }[] = [];
    
    if (financialContext.faturamentoCaiu) {
      chips.push({
        label: "Por que meu faturamento caiu?",
        icon: TrendingDown,
        message: `Meu faturamento caiu de R$ ${formatBRL(financialContext.totalLastMonth)} para R$ ${formatBRL(financialContext.totalThisMonth)}. O que pode ter acontecido e como reverter?`,
      });
    }
    if (financialContext.faturamentoSubiu) {
      chips.push({
        label: "Como manter esse crescimento?",
        icon: TrendingUp,
        message: `Meu faturamento subiu de R$ ${formatBRL(financialContext.totalLastMonth)} para R$ ${formatBRL(financialContext.totalThisMonth)}! Como posso manter esse ritmo?`,
      });
    }
    chips.push({
      label: "Quanto guardar de imposto?",
      icon: Shield,
      message: "Quanto devo separar de imposto esse mês com base no que recebi?",
    });
    if (financialContext.totalThisMonth > 0) {
      chips.push({
        label: `Quantas consultas para R$ ${(financialContext.totalThisMonth * 2).toLocaleString("pt-BR")}?`,
        icon: Target,
        message: `Quantas consultas a mais preciso fazer para dobrar meu faturamento atual de R$ ${formatBRL(financialContext.totalThisMonth)}?`,
      });
    }
    if (financialContext.thisMonthExpenses === 0) {
      chips.push({
        label: "Registrar meus gastos importa?",
        icon: Zap,
        message: "Não tenho despesas registradas esse mês. Por que é importante registrar?",
      });
    }
    return chips.slice(0, 4);
  }, [financialContext]);

  // Load chat history
  useEffect(() => {
    if (!user || historyLoaded) return;
    const loadHistory = async () => {
      const { data } = await supabase
        .from("mentorship_messages")
        .select("role, content")
        .eq("professional_id", user.id)
        .order("created_at", { ascending: true })
        .limit(30);
      if (data && data.length > 0) {
        setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
        setShowSuggestions(false);
      }
      setHistoryLoaded(true);
    };
    loadHistory();
  }, [user, historyLoaded]);

  // Show empty state when no entries and no history
  useEffect(() => {
    if (historyLoaded && hasEntries === false && messages.length === 0) {
      setMessages([EMPTY_STATE_MSG]);
      setShowSuggestions(false);
    }
  }, [historyLoaded, hasEntries, messages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessage = useCallback(
    async (msg: Msg) => {
      if (!user) return;
      await supabase.from("mentorship_messages").insert({
        professional_id: user.id,
        role: msg.role,
        content: msg.content,
      } as any);
    },
    [user]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      if (!canSendMentorship) {
        setUpgradeOpen(true);
        return;
      }
      const userMsg: Msg = { role: "user", content: text.trim() };
      const allMessages = [...messages.filter((m) => m !== EMPTY_STATE_MSG), userMsg];
      setMessages(allMessages);
      setInput("");
      setShowSuggestions(false);
      setIsLoading(true);

      // Save user message
      saveMessage(userMsg);

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
            Authorization: `Bearer ${session?.access_token}`,
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

        // Save assistant response
        if (assistantSoFar) {
          saveMessage({ role: "assistant", content: assistantSoFar });
        }
      } catch (err) {
        console.error("Mentoria chat error:", err);
        const errorMsg: Msg = { role: "assistant", content: "Não consegui responder agora. Tente novamente em instantes." };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, session, saveMessage, canSendMentorship]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmptyState = hasEntries === false && messages.length <= 1 && messages[0] === EMPTY_STATE_MSG;

  return (
    <PageContainer backTo="/dashboard">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {/* Header */}
        <motion.div variants={item}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Sua Mentora Financeira</h1>
              <p className="text-[11px] text-muted-foreground">
                Ela já conhece seus números. Só pergunte.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Chat area */}
        <motion.div variants={item} className="glass-card p-4 flex flex-col" style={{ minHeight: "400px", maxHeight: "65vh" }}>
          <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
            {messages.length === 0 && historyLoaded && hasEntries !== false && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {financialContext?.userName ? `${financialContext.userName}, ` : ""}o que quer saber hoje?
                </p>
                <p className="text-xs text-muted-foreground max-w-[260px]">
                  Pergunte qualquer coisa sobre suas finanças — eu já tenho seus dados aqui.
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
                    <div className="prose prose-sm prose-invert max-w-none [&_strong]:text-primary [&_strong]:font-bold">
                      <ReactMarkdown>{highlightFinancialValues(msg.content)}</ReactMarkdown>
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
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </motion.div>
                    <span className="text-xs text-muted-foreground">Analisando seus dados...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Empty state CTA */}
          {isEmptyState && (
            <Button
              onClick={() => navigate("/dashboard/financeiro")}
              className="w-full mb-3 gradient-primary font-semibold"
            >
              Registrar primeiro recebimento
            </Button>
          )}

          {/* Context card */}
          {!contextDismissed && financialContext?.hasEntries && messages.length === 0 && (
            <button
              onClick={() => setContextDismissed(true)}
              className="w-full text-left rounded-xl bg-primary/5 border border-primary/20 p-3 mb-3 transition-colors hover:bg-primary/10"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none">🧠</span>
                <div className="text-xs text-muted-foreground leading-relaxed space-y-0.5">
                  <p>
                    Faturamento: <span className="text-primary font-semibold">R$ {formatBRL(financialContext.totalThisMonth)}</span>
                    {financialContext.totalLastMonth > 0 && (
                      <> (mês passado: R$ {formatBRL(financialContext.totalLastMonth)})</>
                    )}
                  </p>
                  <p>
                    Consultas: <span className="text-primary font-semibold">{financialContext.thisMonthConsultas}</span>
                    {financialContext.ticketMedio > 0 && (
                      <> · Ticket médio: <span className="text-primary font-semibold">R$ {formatBRL(financialContext.ticketMedio)}</span></>
                    )}
                  </p>
                  <p className="text-muted-foreground/60 text-[10px]">Dados que a mentora usa para responder ↑</p>
                </div>
              </div>
            </button>
          )}

          {/* Dynamic suggestion chips */}
          {showSuggestions && messages.length === 0 && !isEmptyState && (
            <div className="flex flex-wrap gap-2 mb-3">
              {dynamicSuggestions.map((chip) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.label}
                    onClick={() => sendMessage(chip.message)}
                    className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-2 rounded-full hover:bg-primary/20 transition-colors"
                  >
                    <Icon className="h-3 w-3" />
                    {chip.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Input */}
          {!isEmptyState && (
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
          )}
        </motion.div>

        {/* Separator */}
        <motion.div variants={item}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ferramentas rápidas</p>
        </motion.div>

        {/* Card 1 — Reserva de emergência */}
        <motion.div variants={item} className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Reserva de emergência</h2>
          <p className="text-xs text-muted-foreground">Quanto você precisa guardar para se proteger?</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Receita média mensal (R$)</Label>
            <CurrencyInput placeholder="Ex: 8.000" value={receitaMedia} onChange={setReceitaMedia} />
          </div>
          {reservaIdeal !== null && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-primary/10 p-4 text-center space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Sua meta de segurança (6 meses)</p>
              <p className="text-3xl font-bold text-primary">R$ {formatBRL(reservaIdeal)}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">Este valor garante que você mantenha seu padrão de vida por 6 meses em caso de imprevistos.</p>
            </motion.div>
          )}
        </motion.div>

        {/* Card 2 — Preço mínimo por consulta */}
        <motion.div variants={item} className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Preço mínimo por consulta</h2>
          <p className="text-xs text-muted-foreground">Você está cobrando o valor certo?</p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Custos fixos mensais (R$)</Label>
              <CurrencyInput placeholder="Ex: 3.000" value={custos} onChange={setCustos} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Renda desejada (R$)</Label>
              <CurrencyInput placeholder="Ex: 10.000" value={rendaDesejada} onChange={setRendaDesejada} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Consultas por mês</Label>
              <Input type="number" placeholder="Ex: 40" value={consultas} onChange={(e) => setConsultas(e.target.value)} min="1" />
            </div>
          </div>
          {precoMinimo !== null && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">Seu preço mínimo por consulta</p>
              <p className="text-2xl font-bold text-primary">R$ {formatBRL(precoMinimo)}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Card 3 — Carnê-Leão */}
        <motion.div variants={item} className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Carnê-Leão</h2>
          <p className="text-xs text-muted-foreground">Como declarar seus recebimentos.</p>
          {!showGuia ? (
            <Button variant="outline" size="sm" onClick={() => setShowGuia(true)}>Ver guia</Button>
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
      {isFree && (() => {
        const remaining = Math.max(0, mentorshipLimit - mentorshipCount);
        const percent = Math.min(100, (mentorshipCount / mentorshipLimit) * 100);
        const blocked = remaining === 0;

        // Mensagem progressiva: incentivar uso até bater o limite e converter
        let title = "";
        let subtitle = "";
        if (blocked) {
          title = "Você atingiu suas 10 perguntas grátis deste mês 💬";
          subtitle = "Continue organizando sua gestão na plataforma — receitas, despesas, pacientes — e desbloqueie a mentora ilimitada para seguir tirando dúvidas hoje.";
        } else if (remaining === 1) {
          title = "Última pergunta grátis deste mês ⏳";
          subtitle = "Faça valer: pergunte sobre o que mais te incomoda hoje na sua gestão.";
        } else if (percent >= 70) {
          title = `${remaining} perguntas restantes neste mês`;
          subtitle = "Quanto mais você organiza receitas e despesas no Financeiro, mais precisas ficam minhas respostas.";
        } else if (percent >= 40) {
          title = `${mentorshipCount} de ${mentorshipLimit} perguntas usadas`;
          subtitle = "Aproveite — registre seus recebimentos da semana e me pergunte o quanto separar pra impostos.";
        } else {
          title = `Mentora financeira grátis: ${mentorshipCount}/${mentorshipLimit} perguntas este mês`;
          subtitle = "Use também os atalhos do dashboard (Financeiro, Pacientes, Agenda) — eles me alimentam com seus números reais.";
        }

        return (
          <motion.div variants={item} className="glass-card p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-foreground">{title}</p>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {mentorshipCount}/{mentorshipLimit}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  blocked
                    ? "bg-destructive"
                    : percent >= 70
                      ? "bg-amber-500"
                      : "bg-primary"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{subtitle}</p>
            {blocked && (
              <Button
                size="sm"
                className="w-full gradient-primary text-xs h-8 mt-1"
                onClick={() => setUpgradeOpen(true)}
              >
                Liberar mentora ilimitada
              </Button>
            )}
          </motion.div>
        );
      })()}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="mensagens de mentoria" currentUsage={mentorshipCount} limit={mentorshipLimit} />
    </PageContainer>
  );
};

export default DashboardMentoria;
