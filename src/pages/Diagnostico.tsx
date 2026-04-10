import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, DollarSign, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import WhatsAppFab from "@/components/WhatsAppFab";

const SPECIALTIES = [
  { key: "medico", emoji: "🩺", label: "Médico(a)" },
  { key: "psicologo", emoji: "🧠", label: "Psicólogo(a)" },
  { key: "nutricionista", emoji: "🥗", label: "Nutricionista" },
  { key: "dentista", emoji: "🦷", label: "Dentista" },
  { key: "fisioterapeuta", emoji: "🏃", label: "Fisioterapeuta" },
  { key: "outro", emoji: "👩‍⚕️", label: "Outro profissional de saúde" },
];

const REGIMES = [
  { key: "cpf", label: "Autônomo(a) — só CPF, sem empresa" },
  { key: "mei", label: "MEI aberto" },
  { key: "simples", label: "Simples Nacional / Ltda" },
  { key: "nao_sei", label: "Não sei ao certo" },
];

const FATURAMENTOS = [
  { key: "ate_3k", label: "Até R$ 3.000", value: 3000 },
  { key: "3k_6k", label: "R$ 3.000 a R$ 6.000", value: 4500 },
  { key: "6k_12k", label: "R$ 6.000 a R$ 12.000", value: 9000 },
  { key: "12k_20k", label: "R$ 12.000 a R$ 20.000", value: 16000 },
  { key: "acima_20k", label: "Acima de R$ 20.000", value: 25000 },
];

function generateResult(regime: string, faturamento: string) {
  const faixa = FATURAMENTOS.find((f) => f.key === faturamento);
  const valor = faixa?.value || 5000;

  if ((regime === "cpf" || regime === "nao_sei") && valor >= 6000) {
    const impostoAtual = valor * 0.275;
    const impostoSN = valor * 0.06;
    const economia = Math.round(impostoAtual - impostoSN);
    return {
      economia,
      risco: "Tributação excessiva no CPF",
      recomendacao: "Abertura de empresa no Simples Nacional",
      texto: `Com base no seu perfil, você provavelmente está pagando até R$ ${economia.toLocaleString("pt-BR")} a mais por mês de imposto por estar no CPF. A abertura de empresa no regime correto pode resolver isso.`,
      tipo: "alto_risco",
    };
  }

  if (regime === "cpf" && valor < 6000) {
    const economia = Math.round(valor * 0.15);
    return {
      economia,
      risco: "Possível economia tributária",
      recomendacao: "Avaliação por contador especializado",
      texto: `Mesmo com faturamento menor, você pode estar pagando mais imposto do que deveria no CPF. Um contador especializado em saúde pode analisar se vale abrir empresa.`,
      tipo: "medio_risco",
    };
  }

  if (regime === "mei" && valor > 9750) {
    return {
      economia: 0,
      risco: "Ultrapassou o limite do MEI",
      recomendacao: "Migração urgente para Simples Nacional",
      texto: `Você ultrapassou o limite do MEI (R$ 81.000/ano ≈ R$ 6.750/mês). Isso significa risco de desenquadramento e multa retroativa. Precisa migrar agora.`,
      tipo: "urgente",
    };
  }

  if (regime === "mei") {
    return {
      economia: 0,
      risco: "Fique atento ao limite do MEI",
      recomendacao: "Monitorar faturamento mensal",
      texto: `Seu regime pode estar correto por enquanto. Mas fique atento ao limite de R$ 81.000/ano. Se ultrapassar, é necessário migrar para evitar multas.`,
      tipo: "baixo_risco",
    };
  }

  if (regime === "simples") {
    const economia = Math.round(valor * 0.05);
    return {
      economia,
      risco: "Alíquota pode não estar otimizada",
      recomendacao: "Revisão do anexo do Simples Nacional",
      texto: `Seu regime pode estar correto. Mas a alíquota varia conforme o anexo. Um contador especializado em saúde pode reduzir sua carga em até 30%.`,
      tipo: "otimizavel",
    };
  }

  return {
    economia: Math.round(valor * 0.1),
    risco: "Regime tributário incerto",
    recomendacao: "Consultoria com contador especializado",
    texto: `Sem saber seu regime exato, recomendamos uma avaliação completa. Profissionais de saúde frequentemente pagam imposto a mais sem saber.`,
    tipo: "medio_risco",
  };
}

const fadeSlide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

const Diagnostico = () => {
  const [step, setStep] = useState(0); // 0=hero, 1-4=steps, 5=result
  const [especialidade, setEspecialidade] = useState("");
  const [regime, setRegime] = useState("");
  const [faturamento, setFaturamento] = useState("");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [aceitaDicas, setAceitaDicas] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ReturnType<typeof generateResult> | null>(null);

  const handleSubmit = async () => {
    if (!nome.trim() || !whatsapp.trim() || !email.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    const result = generateResult(regime, faturamento);
    setResultado(result);

    await supabase.from("diagnosticos").insert({
      nome: nome.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      especialidade,
      regime_atual: regime,
      faturamento,
      resultado_gerado: result,
      aceita_dicas: aceitaDicas,
    });

    // Open WhatsApp to send result to the lead's number
    const cleanPhone = whatsapp.trim().replace(/\D/g, "");
    const phoneNumber = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const waMsg = encodeURIComponent(
      `Oi ${nome.split(" ")[0]}! Aqui está seu diagnóstico financeiro da SALBCARE 👇\n\n` +
      `💰 Economia estimada: R$ ${result.economia.toLocaleString("pt-BR")}/mês\n` +
      `⚠️ Risco: ${result.risco}\n` +
      `✅ Recomendação: ${result.recomendacao}\n\n` +
      `Para resolver isso definitivamente, você tem 7 dias grátis no ecossistema completo da SALBCARE — agenda, prontuário, teleconsulta e contador especializado em saúde.\n\n` +
      `👉 https://salbcare.lovable.app/register\n\n` +
      `Qualquer dúvida, responde aqui 🙏\n— Bianca, Fundadora SALBCARE`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${waMsg}`, "_blank");

    setLoading(false);
    setStep(5);
  };

  const progress = step > 0 && step < 5 ? (step / 4) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Diagnóstico Financeiro Gratuito para Profissionais de Saúde | SALBCARE"
        description="Descubra em 2 minutos se você está pagando imposto correto. Gratuito, sem cadastro. Para médicos, psicólogos, nutricionistas e mais."
        canonical="/diagnostico"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Diagnóstico Financeiro Gratuito — SALBCARE",
          description: "Descubra em 2 minutos se você está pagando imposto correto.",
          url: "https://salbcare.com.br/diagnostico",
        }}
      />

      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/pwa-icon-512.png" alt="SALBCARE" className="h-7 w-7" />
            <span className="text-base font-bold text-foreground">SALBCARE</span>
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      {step >= 1 && step <= 4 && (
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
            <span>Etapa {step} de 4</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 py-8">
        <AnimatePresence mode="wait">
          {/* HERO */}
          {step === 0 && (
            <motion.div key="hero" {...fadeSlide} className="text-center space-y-6 py-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
              >
                <DollarSign className="h-3.5 w-3.5" /> 100% Gratuito
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                Você está pagando<br />imposto <span className="gradient-text">correto</span>?
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Descubra em 2 minutos quanto você pode estar perdendo por mês. Gratuito. Sem cadastro.
              </p>
              <Button
                size="lg"
                className="h-14 px-10 rounded-xl text-base font-semibold shadow-lg"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                onClick={() => setStep(1)}
              >
                Fazer meu diagnóstico grátis
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <p className="text-[11px] text-muted-foreground/60">Sem cadastro. Leva menos de 2 minutos.</p>
            </motion.div>
          )}

          {/* STEP 1 — Specialty */}
          {step === 1 && (
            <motion.div key="s1" {...fadeSlide} className="space-y-6">
              <h2 className="text-xl font-bold text-center">Qual é a sua especialidade?</h2>
              <div className="grid grid-cols-2 gap-3">
                {SPECIALTIES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => { setEspecialidade(s.key); setStep(2); }}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:ring-2 hover:ring-primary/40 transition-all text-left"
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="text-sm font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Regime */}
          {step === 2 && (
            <motion.div key="s2" {...fadeSlide} className="space-y-6">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <h2 className="text-xl font-bold text-center">Como você trabalha hoje?</h2>
              <div className="space-y-3">
                {REGIMES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => { setRegime(r.key); setStep(3); }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:ring-2 hover:ring-primary/40 transition-all text-left"
                  >
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    <span className="text-sm font-medium">{r.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Revenue */}
          {step === 3 && (
            <motion.div key="s3" {...fadeSlide} className="space-y-6">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <h2 className="text-xl font-bold text-center">Qual é seu faturamento médio por mês?</h2>
              <div className="space-y-3">
                {FATURAMENTOS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setFaturamento(f.key); setStep(4); }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:ring-2 hover:ring-primary/40 transition-all text-left"
                  >
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    <span className="text-sm font-medium">{f.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4 — Contact */}
          {step === 4 && (
            <motion.div key="s4" {...fadeSlide} className="space-y-6">
              <button onClick={() => setStep(3)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <h2 className="text-xl font-bold text-center">Para onde enviamos seu diagnóstico completo?</h2>
              <div className="space-y-4 max-w-sm mx-auto">
                <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="bg-accent border-border" />
                <Input placeholder="WhatsApp (com DDD)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="bg-accent border-border" />
                <Input placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-accent border-border" />
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="dicas"
                    checked={aceitaDicas}
                    onCheckedChange={(v) => setAceitaDicas(!!v)}
                    className="mt-0.5"
                  />
                  <label htmlFor="dicas" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                    Quero receber dicas de gestão financeira para profissionais de saúde
                  </label>
                </div>
                <Button
                  className="w-full h-12 rounded-xl text-base font-semibold gradient-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Gerando diagnóstico..." : "Ver meu diagnóstico agora"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* RESULT */}
          {step === 5 && resultado && (
            <motion.div key="result" {...fadeSlide} className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <CheckCircle className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-xl font-bold">Seu Diagnóstico Financeiro</h2>
                <p className="text-sm text-muted-foreground">{nome.split(" ")[0]}, aqui está o resultado:</p>
              </div>

              {/* Result card */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Economia estimada</p>
                    <p className="text-lg font-bold text-primary">R$ {resultado.economia.toLocaleString("pt-BR")}/mês</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Risco identificado</p>
                    <p className="text-sm font-semibold text-destructive">{resultado.risco}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-accent">
                  <TrendingDown className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Recomendação</p>
                    <p className="text-sm font-semibold">{resultado.recomendacao}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed pt-2">
                  {resultado.texto}
                </p>
              </div>

              {/* CTA */}
              <div className="text-center space-y-3 pt-4">
                <p className="text-base font-semibold">Quer resolver isso agora?</p>
                <Button asChild size="lg" className="h-14 px-10 rounded-xl text-base font-semibold gradient-primary shadow-lg shadow-primary/20">
                  <Link to="/register">
                    Começar 7 dias grátis na SALBCARE
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">Sem cartão de crédito. Cancela quando quiser.</p>
              </div>

              {/* Footer */}
              <div className="text-center space-y-1 pt-6 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                  A SALBCARE é uma plataforma de gestão e não substitui orientação médica, jurídica ou contábil profissional.
                </p>
                <p className="text-[10px] text-muted-foreground/60">Powered by SALBCARE</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <WhatsAppFab />
    </div>
  );
};

export default Diagnostico;
