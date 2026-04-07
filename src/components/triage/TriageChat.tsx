import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { runTriage, type TriageResult } from "@/utils/triageEngine";

type TriageStep = "idle" | "symptoms" | "duration" | "conditions" | "loading" | "result";

const SPECIALTY_LABELS: Record<string, string> = {
  medico: "Médico Clínico Geral",
  psicologo: "Psicólogo",
  nutricionista: "Nutricionista",
  fisioterapeuta: "Fisioterapeuta",
  dentista: "Cirurgião-Dentista",
};

const DURATION_OPTIONS = [
  "Menos de 1 semana",
  "1 a 4 semanas",
  "Mais de 1 mês",
];

interface TriageChatProps {
  onSpecialtyRecommended: (specialtyKey: string) => void;
  onClose: () => void;
}

const TriageChat = ({ onSpecialtyRecommended, onClose }: TriageChatProps) => {
  const [step, setStep] = useState<TriageStep>("symptoms");
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [conditions, setConditions] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);

  const submitTriage = async (finalConditions: string) => {
    setStep("loading");
    try {
      const { data, error } = await supabase.functions.invoke("ai-triage", {
        body: { symptoms, duration, conditions: finalConditions },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as TriageResult);
      setStep("result");
    } catch (err: any) {
      console.error("Triage error:", err);
      toast.error("Não foi possível completar a triagem. Tente novamente.");
      setStep("conditions");
    }
  };

  const handleSeeResults = () => {
    if (result) {
      onSpecialtyRecommended(result.especialidade);
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* Chat messages */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
        {/* Bot greeting */}
        <BotMessage>
          Olá! 👋 Sou o assistente de triagem da SALBCARE. Me conta — o que você está sentindo ou o que te preocupa?
        </BotMessage>

        {/* Step: Symptoms */}
        {step === "symptoms" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <Textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Descreva seus sintomas aqui..."
              className="bg-accent border-border min-h-[80px] text-sm"
              maxLength={500}
            />
            <Button
              size="sm"
              className="w-full gradient-primary"
              disabled={!symptoms.trim()}
              onClick={() => setStep("duration")}
            >
              Enviar <Send className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </motion.div>
        )}

        {/* User answer for symptoms shown */}
        {step !== "symptoms" && step !== "idle" && symptoms && (
          <UserMessage>{symptoms}</UserMessage>
        )}

        {/* Step: Duration */}
        {(step === "duration" || (step !== "symptoms" && step !== "idle" && duration)) && (
          <>
            <BotMessage>Há quanto tempo você está sentindo isso?</BotMessage>
            {step === "duration" ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1.5">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setDuration(opt); setStep("conditions"); }}
                    className="text-left text-xs px-3 py-2.5 rounded-lg bg-muted hover:bg-accent transition-colors border border-border"
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            ) : (
              <UserMessage>{duration}</UserMessage>
            )}
          </>
        )}

        {/* Step: Conditions */}
        {(step === "conditions" || step === "loading" || step === "result") && duration && (
          <>
            <BotMessage>Você tem alguma condição de saúde que já conhece? (opcional)</BotMessage>
            {step === "conditions" ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <Textarea
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="Ex: diabetes, hipertensão... ou deixe em branco"
                  className="bg-accent border-border min-h-[60px] text-sm"
                  maxLength={300}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => submitTriage("Não tenho")}
                  >
                    Não tenho
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gradient-primary text-xs"
                    onClick={() => submitTriage(conditions || "Não tenho")}
                  >
                    Enviar <Send className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <UserMessage>{conditions || "Não tenho"}</UserMessage>
            )}
          </>
        )}

        {/* Loading */}
        {step === "loading" && (
          <BotMessage>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Analisando seus sintomas...</span>
            </div>
          </BotMessage>
        )}

        {/* Result */}
        {step === "result" && result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {result.urgencia === "alta" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  🚨 Os sintomas que você descreveu podem precisar de atenção urgente. Considere ir a um pronto-socorro ou ligar <strong>192 (SAMU)</strong>.
                </p>
              </div>
            )}

            <BotMessage>
              <div className="space-y-2">
                <p>
                  Com base no que você me contou, recomendo consultar um{" "}
                  <strong>{SPECIALTY_LABELS[result.especialidade] || result.especialidade}</strong>.
                </p>
                <p className="text-muted-foreground">{result.motivo}</p>
              </div>
            </BotMessage>

            <Button size="sm" className="w-full gradient-primary" onClick={handleSeeResults}>
              Ver profissionais disponíveis <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        ⚠️ Esta triagem é informativa e não substitui avaliação médica profissional. Em emergências, ligue 192 (SAMU).
      </p>
    </div>
  );
};

const BotMessage = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2">
    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
      <Bot className="h-3.5 w-3.5 text-primary" />
    </div>
    <div className="bg-muted rounded-lg rounded-tl-sm px-3 py-2 text-xs max-w-[85%]">
      {children}
    </div>
  </motion.div>
);

const UserMessage = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
    <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-sm px-3 py-2 text-xs max-w-[85%]">
      {children}
    </div>
  </motion.div>
);

export default TriageChat;
