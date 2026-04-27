import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, FileText, ShieldCheck, Award, Lock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePremiumFeature } from "@/hooks/usePremiumFeature";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import PageContainer from "@/components/PageContainer";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";

type Componente = { score: number; peso: number; teto: number; detalhe: string; sugestao: string };
type ScoreData = {
  score: number;
  faixa: string;
  componentes: Record<string, Componente>;
  evolucao: { score: number; calculado_em: string }[];
  media_mensal_6m: number;
  media_mensal_12m: number;
  total_atendimentos_12m: number;
  meses_ativo: number;
};

const COMPONENT_LABELS: Record<string, string> = {
  tempo_atividade: "Tempo de atividade verificada",
  consistencia_atendimentos: "Consistência de atendimentos (12 meses)",
  volume_pacientes: "Volume de pacientes únicos",
  recebimentos_comprovados: "Recebimentos comprovados",
  conformidade_regulatoria: "Conformidade regulatória",
  organizacao_financeira: "Organização financeira",
  retencao_pacientes: "Retenção de pacientes",
};

const FAIXA_INFO: Record<string, { label: string; color: string; bg: string; descricao: string }> = {
  iniciante: { label: "Iniciante", color: "#9CA3AF", bg: "rgba(156,163,175,0.12)", descricao: "Construindo histórico" },
  desenvolvimento: { label: "Em desenvolvimento", color: "#60A5FA", bg: "rgba(96,165,250,0.12)", descricao: "Ganhando consistência" },
  estabelecido: { label: "Estabelecido", color: "#3B82F6", bg: "rgba(59,130,246,0.12)", descricao: "Profissional consolidado" },
  premium: { label: "Premium", color: "#00B4A0", bg: "rgba(0,180,160,0.12)", descricao: "Alta confiabilidade" },
  elite: { label: "Elite", color: "#D4A017", bg: "rgba(212,160,23,0.14)", descricao: "Topo da plataforma" },
};

const ScoreRing = ({ score, color }: { score: number; color: string }) => {
  const pct = Math.min(1, score / 1000);
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative w-[220px] h-[220px]">
      <svg width="220" height="220" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r={radius} stroke="rgba(15,23,42,0.08)" strokeWidth="14" fill="none" />
        <motion.circle
          cx="110" cy="110" r={radius}
          stroke={color} strokeWidth="14" fill="none" strokeLinecap="round"
          transform="rotate(-90 110 110)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - circumference * pct }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
          className="text-5xl font-bold tracking-tight" style={{ color: "#0D1B2A" }}
        >
          {score}
        </motion.div>
        <div className="text-xs text-muted-foreground mt-1">de 1000 pontos</div>
      </div>
    </div>
  );
};

const SalbScore = () => {
  const { user } = useAuth();
  const { isPaid, isAdmin } = usePremiumFeature();
  const navigate = useNavigate();
  const hasFullAccess = isPaid || isAdmin;
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      try {
        const { data: result, error } = await supabase.functions.invoke("calcular-salbscore");
        if (error) throw error;
        setData(result as ScoreData);
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível calcular seu SalbScore agora.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleGenerate = async (tipo: "comprovante_renda") => {
    if (!hasFullAccess) {
      toast.error("Comprovantes oficiais são exclusivos do plano pago.");
      navigate("/upgrade");
      return;
    }
    setGenerating(tipo);
    try {
      const { data: result, error } = await supabase.functions.invoke("gerar-documento-salbscore", {
        body: { tipo },
      });
      if (error) throw error;
      const r = result as { pdf_base64: string; hash: string };
      // Trigger download
      const blob = new Blob([Uint8Array.from(atob(r.pdf_base64), (c) => c.charCodeAt(0))], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comprovante-renda-salbcare-${r.hash}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("Comprovante emitido com sucesso.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível emitir o documento.");
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  const faixaInfo = data ? FAIXA_INFO[data.faixa] ?? FAIXA_INFO.iniciante : FAIXA_INFO.iniciante;
  const blurScore = !hasFullAccess && data;
  const semDados = !data || (data.score === 0 && data.meses_ativo < 1);

  return (
    <PageContainer>
      <SEOHead title="SalbScore — Sua reputação financeira | SalbCare" description="Acompanhe sua nota de saúde financeira e profissional construída na SalbCare." />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8 pb-24">
        <BackButton />
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">SalbScore</p>
          <h1 className="text-2xl font-bold" style={{ color: "#0D1B2A" }}>Sua reputação construída na SalbCare</h1>
          <p className="text-sm text-muted-foreground">
            Quanto mais tempo você usa a plataforma, mais sólida fica sua nota — e mais portas ela abre.
          </p>
        </header>

        {/* Bloco 1 — Score visual */}
        <section
          className="rounded-2xl p-8 flex flex-col items-center text-center space-y-4"
          style={{ background: faixaInfo.bg, border: `1px solid ${faixaInfo.color}33` }}
        >
          <div className={blurScore ? "blur-md select-none pointer-events-none" : ""} aria-hidden={blurScore ? true : undefined}>
            {data ? <ScoreRing score={data.score} color={faixaInfo.color} /> : <ScoreRing score={0} color={faixaInfo.color} />}
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold uppercase tracking-wider" style={{ color: faixaInfo.color }}>
              {hasFullAccess ? faixaInfo.label : "Bloqueado"}
            </div>
            {hasFullAccess ? (
              semDados ? (
                <p className="text-sm text-muted-foreground max-w-md">
                  Ainda não há dados suficientes para calcular sua nota. Registre seus primeiros atendimentos e recebimentos no Financeiro — seu SalbScore começa a subir automaticamente em 24h.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground max-w-md">
                  Você construiu <strong>{data?.score ?? 0} pontos</strong>. {faixaInfo.descricao}.
                </p>
              )
            ) : (
              <div className="space-y-2 max-w-md">
                <p className="text-sm text-muted-foreground">
                  Seu SalbScore está bloqueado. O plano pago libera:
                </p>
                <ul className="text-xs text-left text-muted-foreground space-y-1 mx-auto inline-block">
                  <li>✓ Sua nota completa de 0 a 1000 pontos</li>
                  <li>✓ Insights de cada componente e como melhorar</li>
                  <li>✓ Emissão de Comprovante de Renda oficial em PDF</li>
                  <li>✓ Selo público verificável (em breve)</li>
                </ul>
              </div>
            )}
          </div>
          {!hasFullAccess && (
            <Button onClick={() => navigate("/upgrade")} className="mt-2">
              Desbloquear meu SalbScore
            </Button>
          )}
        </section>

        {/* Bloco 2 — Componentes */}
        {data && hasFullAccess && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold" style={{ color: "#0D1B2A" }}>O que compõe sua nota</h2>
            <div className="space-y-4">
              {Object.entries(data.componentes).map(([key, c]) => {
                const pct = (c.score / c.teto) * 100;
                return (
                  <div key={key} className="rounded-xl border border-border/60 p-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium" style={{ color: "#0D1B2A" }}>{COMPONENT_LABELS[key]}</span>
                      <span className="text-xs text-muted-foreground">{c.score}/{c.teto} • peso {c.peso}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="text-xs text-muted-foreground">{c.detalhe}</div>
                    <div className="text-xs" style={{ color: "#00B4A0" }}>💡 {c.sugestao}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Bloco 3 — Documentos */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold" style={{ color: "#0D1B2A" }}>Documentos que você pode emitir</h2>
          <div className="grid gap-3 sm:grid-cols-1">
            <DocCard
              icon={<FileText className="h-5 w-5" />}
              title="Comprovante de Renda SalbCare"
              description="PDF oficial com selo e código de verificação. Mostra média mensal de recebimentos comprovados pela plataforma. Aceito por imobiliárias, bancos parceiros e consulados."
              locked={!hasFullAccess}
              loading={generating === "comprovante_renda"}
              onAction={() => handleGenerate("comprovante_renda")}
              actionLabel="Emitir comprovante"
            />
            <DocCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Certidão de Atividade Profissional"
              description="Comprova tempo de atuação, volume mensal de atendimentos e conselho profissional ativo. Útil para credenciamento, processos e parcerias."
              locked
              comingSoon
            />
            <DocCard
              icon={<Award className="h-5 w-5" />}
              title="Selo Verificado Público"
              description="Página pública com seu SalbScore, faixa e dados profissionais. URL única para colocar no Instagram, site ou consultório."
              locked
              comingSoon
            />
          </div>
        </section>
      </div>
    </PageContainer>
  );
};

const DocCard = ({
  icon, title, description, locked, comingSoon, loading, onAction, actionLabel,
}: {
  icon: React.ReactNode; title: string; description: string;
  locked?: boolean; comingSoon?: boolean; loading?: boolean;
  onAction?: () => void; actionLabel?: string;
}) => (
  <div className="rounded-xl border border-border/60 p-5 space-y-3">
    <div className="flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "rgba(0,180,160,0.10)", color: "#00B4A0" }}
      >
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm" style={{ color: "#0D1B2A" }}>{title}</h3>
          {locked && !comingSoon && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(212,160,23,0.14)", color: "#D4A017" }}>
              <Lock className="inline h-2.5 w-2.5 mr-0.5" /> Premium
            </span>
          )}
          {comingSoon && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Em breve</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
    {!comingSoon && (
      <Button
        onClick={onAction}
        disabled={loading || locked}
        size="sm"
        variant={locked ? "outline" : "default"}
        className="w-full"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
          <>
            {locked ? <Lock className="h-3.5 w-3.5 mr-1" /> : <Download className="h-3.5 w-3.5 mr-1" />}
            {locked ? "Upgrade para emitir" : actionLabel}
          </>
        )}
      </Button>
    )}
  </div>
);

export default SalbScore;
