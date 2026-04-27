import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, ExternalLink, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import PageContainer from "@/components/PageContainer";
import BackButton from "@/components/BackButton";

/**
 * Página /perfil/salbscore/selo-exemplo
 * Read-only preview do Selo Verificado Público para o profissional ver
 * como ficaria sua URL antes de ter o selo emitido publicamente.
 */
const SalbScoreSeloPreview = () => {
  const exemplo = {
    nome: "Dra. Marina Albuquerque",
    conselho: "PSICOLOGA CRP 06 234567",
    score: 782,
    faixa: { label: "Premium", color: "#00B4A0", bg: "rgba(0,180,160,0.12)", desc: "Alta confiabilidade comprovada" },
    meses: 18,
    bio: "Psicóloga clínica com foco em ansiedade e relacionamentos. Atendimento online e presencial.",
    slug: "marina-albuquerque",
  };

  return (
    <PageContainer>
      <SEOHead
        title="Exemplo do Selo Verificado | SalbCare"
        description="Veja como fica seu Selo Verificado Público SalbScore antes de emiti-lo."
      />
      <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">
        <BackButton />
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Eye className="h-3 w-3" /> Pré-visualização
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "#0D1B2A" }}>Seu Selo Verificado Público</h1>
          <p className="text-sm text-muted-foreground">
            Esta é uma pré-visualização real de como sua página pública aparece para pacientes, bancos e parceiros quando você compartilha o link do selo.
          </p>
        </header>

        {/* Mock do selo público */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 text-center space-y-4 relative"
        >
          <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/70 rounded px-2 py-0.5">
            Exemplo
          </div>
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Award className="h-3.5 w-3.5" /> Selo Verificado SalbCare
          </div>

          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-xl font-semibold"
            style={{ background: "rgba(0,180,160,0.12)", color: "#00B4A0", border: "2px solid #00B4A0" }}
          >
            MA
          </div>

          <div className="space-y-0.5">
            <h2 className="text-lg font-semibold" style={{ color: "#0D1B2A" }}>{exemplo.nome}</h2>
            <p className="text-xs text-muted-foreground">{exemplo.conselho}</p>
          </div>

          <div
            className="rounded-xl py-5 px-4 space-y-1"
            style={{ background: exemplo.faixa.bg, border: `1px solid ${exemplo.faixa.color}33` }}
          >
            <div className="text-[11px] uppercase tracking-wider font-medium" style={{ color: exemplo.faixa.color }}>
              SalbScore
            </div>
            <div className="text-4xl font-bold tracking-tight" style={{ color: "#0D1B2A" }}>
              {exemplo.score}
              <span className="text-base text-muted-foreground font-normal"> / 1000</span>
            </div>
            <div className="text-sm font-medium" style={{ color: exemplo.faixa.color }}>{exemplo.faixa.label}</div>
            <div className="text-xs text-muted-foreground">{exemplo.faixa.desc}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-muted/50 p-2.5">
              <div className="text-muted-foreground">Atividade</div>
              <div className="font-semibold" style={{ color: "#0D1B2A" }}>{exemplo.meses} meses</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5">
              <div className="text-muted-foreground">Última atualização</div>
              <div className="font-semibold" style={{ color: "#0D1B2A" }}>hoje</div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 p-3 text-xs text-muted-foreground leading-relaxed text-left">
            {exemplo.bio}
          </div>

          <div className="text-[10px] text-muted-foreground pt-1">
            URL pública: <span className="font-mono">salbcare.com.br/verificado/{exemplo.slug}</span>
          </div>
        </motion.div>

        {/* CTA próximo passo */}
        <div className="rounded-xl border border-border/60 p-5 space-y-3 text-center" style={{ background: "rgba(0,180,160,0.05)" }}>
          <Lock className="h-5 w-5 mx-auto text-muted-foreground" />
          <h3 className="text-sm font-semibold" style={{ color: "#0D1B2A" }}>
            Seu selo ainda não está ativo
          </h3>
          <p className="text-xs text-muted-foreground">
            Para liberar sua URL pública verificada, complete os primeiros atendimentos na plataforma e mantenha o plano Essencial ativo.
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <Link to="/perfil/salbscore">
              <Button className="w-full" style={{ background: "#00B4A0" }}>
                Ver meu SalbScore atual <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
            <Link to="/upgrade">
              <Button className="w-full" variant="outline">
                Conhecer plano Essencial
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          Quando ativo, qualquer pessoa pode validar seu selo escaneando o QR Code ou acessando a URL pública.
        </p>
      </div>
    </PageContainer>
  );
};

export default SalbScoreSeloPreview;
