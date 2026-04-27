import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { Award, ExternalLink, Eye, Lock, QrCode, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import PageContainer from "@/components/PageContainer";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/hooks/useUserType";

/**
 * Página /perfil/salbscore/selo-exemplo
 * Read-only preview do Selo Verificado Público + QR Code da URL.
 */
const SalbScoreSeloPreview = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { userType } = useUserType();
  const isPaid = profile?.payment_status === "active" || profile?.payment_status === "trialing" || profile?.payment_status === "paid";

  const exemplo = {
    nome: "Dra. Marina Albuquerque",
    conselho: "PSICOLOGA CRP 06 234567",
    score: 782,
    faixa: { label: "Premium", color: "#00B4A0", bg: "rgba(0,180,160,0.12)", desc: "Alta confiabilidade comprovada" },
    meses: 18,
    bio: "Psicóloga clínica com foco em ansiedade e relacionamentos. Atendimento online e presencial.",
    slug: profile?.profile_slug || "marina-albuquerque",
  };

  const publicUrl = `https://salbcare.com.br/verificado/${exemplo.slug}`;

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateQR = async () => {
    setGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(publicUrl, {
        width: 320,
        margin: 1,
        color: { dark: "#0D1B2A", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(dataUrl);
    } catch {
      toast.error("Não foi possível gerar o QR Code agora.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("URL copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `salbscore-${exemplo.slug}.png`;
    a.click();
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
            Veja como sua página pública aparece para pacientes, bancos e parceiros quando você compartilha o link do selo.
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

          <div className="text-[10px] text-muted-foreground pt-1 break-all">
            URL pública: <span className="font-mono">{publicUrl.replace("https://", "")}</span>
          </div>
        </motion.div>

        {/* QR Code */}
        <section className="rounded-xl border border-border/60 p-5 space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold" style={{ color: "#0D1B2A" }}>
            <QrCode className="h-4 w-4" /> QR Code do seu selo
          </div>
          <p className="text-xs text-muted-foreground">
            Compartilhe rapidamente sua URL pública com pacientes, bancos e parceiros.
          </p>

          {qrDataUrl ? (
            <div className="space-y-3">
              <img
                src={qrDataUrl}
                alt={`QR Code do selo verificado ${exemplo.nome}`}
                className="mx-auto w-48 h-48 rounded-lg border border-border/60 bg-white p-2"
              />
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" onClick={handleDownloadQR}>
                  Baixar QR Code (PNG)
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? "URL copiada" : "Copiar URL"}
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleGenerateQR} disabled={generating} className="w-full" style={{ background: "#0D1B2A" }}>
              <QrCode className="h-4 w-4 mr-2" />
              {generating ? "Gerando..." : "Gerar QR Code"}
            </Button>
          )}
        </section>

        {/* CTA próximo passo */}
        <div className="rounded-xl border border-border/60 p-5 space-y-3 text-center" style={{ background: "rgba(0,180,160,0.05)" }}>
          <Lock className="h-5 w-5 mx-auto text-muted-foreground" />
          <h3 className="text-sm font-semibold" style={{ color: "#0D1B2A" }}>
            {isPaid ? "Sua URL pública pode estar pronta" : "Seu selo ainda não está ativo"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isPaid
              ? "Acesse seu SalbScore para conferir a URL real do seu selo verificado."
              : "Para liberar sua URL pública verificada, ative o plano Essencial e mantenha seu histórico de atendimentos."}
          </p>
          <div className="flex flex-col gap-2 pt-1">
            {profile?.profile_slug && isPaid && (
              <Link to={`/verificado/${profile.profile_slug}`} target="_blank" rel="noopener">
                <Button className="w-full" variant="outline">
                  Abrir minha URL pública <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            )}
            <Button onClick={() => navigate("/perfil/salbscore")} className="w-full" style={{ background: "#00B4A0" }}>
              Ver meu SalbScore atual
            </Button>
            {!isPaid && (
              <Button onClick={() => navigate("/upgrade")} className="w-full" variant="outline">
                Fazer upgrade para Essencial
              </Button>
            )}
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
